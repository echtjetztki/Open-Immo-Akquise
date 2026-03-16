import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    activateN8nCodeForRequest,
    checkN8nActivationForRequest,
} from '@/lib/n8n-activation';

const setActivatedCookie = async (maxAgeSeconds: number) => {
    const cookieStore = await cookies();
    cookieStore.set('n8n_activated', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
    });
};

const clearActivatedCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set('n8n_activated', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
};

export async function GET(request: Request) {
    try {
        const state = await checkN8nActivationForRequest(request);
        if (state.active) {
            await setActivatedCookie(state.cacheTtlSeconds);
            return NextResponse.json({ success: true, active: true, source: 'supabase' });
        }

        await clearActivatedCookie();
        return NextResponse.json({ success: true, active: false, source: 'supabase' });
    } catch {
        await clearActivatedCookie();
        return NextResponse.json(
            { success: false, active: false, error: 'n8n Aktivierungspruefung nicht erreichbar.' },
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
                { success: false, error: 'Aktivierungscode fehlt.' },
                { status: 400 }
            );
        }

        const state = await activateN8nCodeForRequest(request, key);
        if (!state.active) {
            await clearActivatedCookie();
            return NextResponse.json(
                { success: false, error: state.message || 'Ungueltiger Aktivierungscode.' },
                { status: 401 }
            );
        }

        await setActivatedCookie(state.cacheTtlSeconds);
        return NextResponse.json({ success: true, active: true, source: 'supabase' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (message === 'n8n_activation_key_not_found') {
            return NextResponse.json(
                { success: false, error: 'n8n Aktivierungsschluessel nicht gefunden.' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Serverfehler bei der n8n Aktivierung.' },
            { status: 500 }
        );
    }
}
