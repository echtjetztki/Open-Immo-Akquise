import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEMO_READ_ONLY_MESSAGE, isDemoReadOnly } from '@/lib/demo-mode';
import { checkN8nActivationForRequest } from '@/lib/n8n-activation';
import { decodeSessionValue } from '@/lib/session';

export type SessionRole = 'admin' | 'user' | 'agent';

export type SessionUser = {
    userId?: number;
    username?: string;
    displayName?: string;
    role?: SessionRole;
};

type AccessResult =
    | { ok: true; user: SessionUser }
    | { ok: false; response: NextResponse };

const unauthorized = (message = 'Nicht autorisiert', status = 401) =>
    NextResponse.json({ error: message }, { status });

export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
        return null;
    }

    const parsed = await decodeSessionValue(session.value);
    return (parsed as SessionUser | null) ?? null;
}

export async function requireSessionUser(allowedRoles?: SessionRole[]): Promise<AccessResult> {
    const user = await getSessionUser();

    if (!user?.role) {
        return { ok: false, response: unauthorized() };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return { ok: false, response: unauthorized('Nicht autorisiert', 403) };
    }

    return { ok: true, user };
}

export function blockDemoWrites(): NextResponse | null {
    if (!isDemoReadOnly()) {
        return null;
    }

    return NextResponse.json(
        {
            error: DEMO_READ_ONLY_MESSAGE,
            code: 'DEMO_READ_ONLY'
        },
        { status: 403 }
    );
}

export async function requireN8nActivation(request: Request): Promise<NextResponse | null> {
    try {
        const state = await checkN8nActivationForRequest(request);
        if (state.active) {
            return null;
        }

        return NextResponse.json(
            {
                error: 'n8n Aktivierung erforderlich.',
                code: 'N8N_ACTIVATION_REQUIRED',
            },
            { status: 403 }
        );
    } catch {
        return NextResponse.json(
            {
                error: 'n8n Aktivierungspruefung derzeit nicht verfuegbar.',
                code: 'N8N_ACTIVATION_CHECK_FAILED',
            },
            { status: 503 }
        );
    }
}
