import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendSecurityWebhook } from '@/lib/security-webhook';
import { findAgentOption, normalizeAgentName } from '@/lib/agent-options';
import { query } from '@/lib/db';
import { ensureUsersTable, getAgentOptions } from '@/lib/users';

const normalize = normalizeAgentName;

type SessionRole = 'admin' | 'user' | 'agent';

type SessionUser = {
    userId: number;
    username: string;
    displayName: string;
    role: SessionRole;
};

type DbUserRow = {
    id: number;
    username: string;
    role: SessionRole;
    display_name?: string | null;
    password_hash?: string | null;
};

const normalizeText = (value: unknown) => (value ?? '').toString().trim().toLowerCase();

const toSessionUser = (user: DbUserRow): SessionUser => {
    const username = (user.username ?? '').toString().trim();
    const displayName = (user.display_name ?? username).toString().trim() || username;
    return {
        userId: Number(user.id),
        username,
        displayName,
        role: user.role,
    };
};

async function getAgentUser(selectedAgent: string): Promise<DbUserRow | null> {
    await ensureUsersTable();
    const result = await query(
        `SELECT id, username, role, display_name, password_hash
         FROM users
         WHERE role = 'agent'
           AND (
             LOWER(TRIM(username)) = LOWER(TRIM($1))
             OR LOWER(TRIM(COALESCE(display_name, ''))) = LOWER(TRIM($1))
           )
         ORDER BY
           CASE WHEN LOWER(TRIM(COALESCE(display_name, ''))) = LOWER(TRIM($1)) THEN 0 ELSE 1 END,
           id ASC
         LIMIT 1`,
        [selectedAgent]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as DbUserRow;
}

async function getTeamUserByPassword(password: string): Promise<DbUserRow | null> {
    await ensureUsersTable();
    const result = await query(
        `SELECT id, username, role, display_name, password_hash
         FROM users
         WHERE role IN ('admin', 'user')
           AND password_hash = $1
         ORDER BY
           CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
           id ASC
         LIMIT 1`,
        [password]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as DbUserRow;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const password = (body?.password ?? '').toString();
        const mode = normalize(body?.mode);
        const agentInput = (body?.agent ?? '').toString();

        if (!password) {
            await sendSecurityWebhook(request, {
                event: 'login_failed',
                reason: 'missing_password',
                mode,
                targetAgent: agentInput,
                source: 'api/login'
            });
            return NextResponse.json(
                { success: false, error: 'Bitte Passwort eingeben' },
                { status: 400 }
            );
        }

        const isAgentLogin = mode === 'agent' || (!!agentInput && mode !== 'team');

        let role: SessionRole | null = null;
        let authUser: SessionUser | null = null;
        let redirectTo = '';
        let dbAuthError = '';

        const adminPw = (process.env.ADMIN_PASSWORD || '').trim();
        const userPw = (process.env.USER_PASSWORD || '').trim();
        const hasLegacyEnvCredentials = Boolean(adminPw || userPw);

        if (isAgentLogin) {
            const availableAgents = await getAgentOptions();
            const selectedAgent = findAgentOption(agentInput, availableAgents);
            if (!selectedAgent) {
                await sendSecurityWebhook(request, {
                    event: 'login_failed',
                    reason: 'invalid_agent_selection',
                    mode,
                    targetAgent: agentInput,
                    metadata: {
                        availableAgents,
                    },
                    source: 'api/login'
                });
                return NextResponse.json(
                    { success: false, error: 'Bitte einen gueltigen Betreuer auswaehlen' },
                    { status: 400 }
                );
            }

            try {
                const dbAgent = await getAgentUser(selectedAgent);
                if (dbAgent) {
                    if (password !== (dbAgent.password_hash ?? '')) {
                        await sendSecurityWebhook(request, {
                            event: 'login_failed',
                            reason: 'wrong_password',
                            mode,
                            targetAgent: selectedAgent,
                            source: 'api/login'
                        });
                        return NextResponse.json(
                            { success: false, error: 'Falsches Passwort' },
                            { status: 401 }
                        );
                    }

                    role = 'agent';
                    authUser = toSessionUser({ ...dbAgent, role: 'agent' });
                    redirectTo = `/agent/${encodeURIComponent(authUser.displayName)}`;
                }
            } catch (error: unknown) {
                dbAuthError = error instanceof Error ? error.message : 'Unknown DB error';
            }

            if (!authUser && userPw && password === userPw) {
                role = 'agent';
                authUser = {
                    userId: 200 + Math.max(availableAgents.findIndex((name) => normalizeText(name) === normalizeText(selectedAgent)), 0),
                    username: selectedAgent.toLowerCase(),
                    displayName: selectedAgent,
                    role: 'agent'
                };
                redirectTo = `/agent/${encodeURIComponent(selectedAgent)}`;
            }
        } else {
            try {
                const dbTeamUser = await getTeamUserByPassword(password);
                if (dbTeamUser && (dbTeamUser.role === 'admin' || dbTeamUser.role === 'user')) {
                    role = dbTeamUser.role;
                    authUser = toSessionUser(dbTeamUser);
                    redirectTo = role === 'admin' ? '/' : '/user';
                }
            } catch (error: unknown) {
                dbAuthError = error instanceof Error ? error.message : 'Unknown DB error';
            }

            if (!authUser && adminPw && password === adminPw) {
                role = 'admin';
                authUser = { userId: 1, username: 'admin', displayName: 'Administrator', role: 'admin' };
                redirectTo = '/';
            } else if (!authUser && userPw && password === userPw) {
                role = 'user';
                authUser = { userId: 2, username: 'user', displayName: 'User', role: 'user' };
                redirectTo = '/user';
            }
        }

        if (!role || !authUser || !redirectTo) {
            if (dbAuthError && !hasLegacyEnvCredentials) {
                await sendSecurityWebhook(request, {
                    event: 'login_failed',
                    reason: 'authentication_backend_unavailable',
                    mode,
                    targetAgent: agentInput,
                    error: dbAuthError,
                    source: 'api/login'
                });
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Anmeldung nicht verfuegbar. Weder Benutzerdatenbank noch Legacy-Passwoerter sind korrekt konfiguriert.'
                    },
                    { status: 500 }
                );
            }

            await sendSecurityWebhook(request, {
                event: 'login_failed',
                reason: 'wrong_password',
                mode,
                targetAgent: agentInput,
                source: 'api/login'
            });
            return NextResponse.json(
                { success: false, error: 'Falsches Passwort' },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();

        cookieStore.set('session', JSON.stringify(authUser), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        cookieStore.delete('admin_session');
        cookieStore.delete('user_session');

        const isProd = process.env.NODE_ENV === 'production';
        if (role === 'admin') {
            cookieStore.set('admin_session', 'authenticated', {
                path: '/',
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax'
            });
        } else {
            cookieStore.set('user_session', 'authenticated', {
                path: '/',
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax'
            });
        }

        await sendSecurityWebhook(request, {
            event: 'login_success',
            username: authUser.username,
            displayName: authUser.displayName,
            role: authUser.role,
            mode,
            targetAgent: authUser.role === 'agent' ? authUser.displayName : undefined,
            source: 'api/login'
        });

        return NextResponse.json({
            success: true,
            role,
            user: {
                username: authUser.username,
                displayName: authUser.displayName,
                role: authUser.role
            },
            redirectTo
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Login error:', error);
        await sendSecurityWebhook(request, {
            event: 'login_failed',
            reason: 'server_error',
            error: message,
            source: 'api/login'
        });
        return NextResponse.json(
            { success: false, error: 'Ein Fehler ist aufgetreten: ' + message },
            { status: 500 }
        );
    }
}
