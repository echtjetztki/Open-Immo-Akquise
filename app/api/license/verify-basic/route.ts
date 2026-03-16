import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    activateLicenseCodeWithServer,
    checkActiveLicenseForRequest,
} from '@/lib/license';

const setVerifiedCookie = async (maxAgeSeconds: number) => {
    const cookieStore = await cookies();
    cookieStore.set('basic_license_verified', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds
    });
};

const clearVerifiedCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set('basic_license_verified', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
};

export async function GET(request: Request) {
    try {
        const state = await checkActiveLicenseForRequest(request);
        if (state.active) {
            await setVerifiedCookie(state.cacheTtlSeconds);
            return NextResponse.json({ success: true, active: true, source: 'supabase' });
        }

        await clearVerifiedCookie();
        return NextResponse.json({ success: true, active: false, source: 'supabase' });
    } catch {
        await clearVerifiedCookie();
        return NextResponse.json(
            { success: false, active: false, error: 'Lizenzpruefung nicht erreichbar.' },
            { status: 503 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const key = (body?.key ?? '').toString().trim();
        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Lizenzcode fehlt.' },
                { status: 400 }
            );
        }

        const state = await activateLicenseCodeWithServer(request, key);
        if (!state.active) {
            await clearVerifiedCookie();
            return NextResponse.json(
                { success: false, error: state.message || 'Ungueltiger oder inaktiver Lizenzcode.' },
                { status: 401 }
            );
        }

        await setVerifiedCookie(state.cacheTtlSeconds);

        return NextResponse.json({
            success: true,
            active: true,
            source: 'supabase'
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'license_key_not_found') {
            return NextResponse.json(
                { success: false, error: 'Lizenzschluessel nicht gefunden.' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Serverfehler bei der Lizenzpruefung.' },
            { status: 500 }
        );
    }
}
