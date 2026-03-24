import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeSessionValue } from '@/lib/session';

type SessionRole = 'admin' | 'user' | 'agent';

type SessionUser = {
    role?: SessionRole;
    displayName?: string;
    username?: string;
};

const normalizePath = (value: string) => (value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value);
const EXPIRED_COOKIE_DATE = new Date(0);

const isSessionRole = (role?: string): role is SessionRole =>
    role === 'admin' || role === 'user' || role === 'agent';

const clearAuthCookies = (response: NextResponse) => {
    response.cookies.set('session', '', { path: '/', expires: EXPIRED_COOKIE_DATE });
    response.cookies.set('admin_session', '', { path: '/', expires: EXPIRED_COOKIE_DATE });
    response.cookies.set('user_session', '', { path: '/', expires: EXPIRED_COOKIE_DATE });
    return response;
};

const isTeamleiterPath = (path: string) =>
    path === '/user' || path === '/user/settings';

const isAgentAreaPath = (path: string) =>
    path === '/agent' || path.startsWith('/agent/');

// Öffentliche Routen (kein Login nötig)
const PUBLIC_PATHS = [
    '/login', 
    '/agent', 
    '/empfehlung', 
    '/api/referrals/public',
    '/payment',
    '/api/payment',
    '/.well-known'
];

const isPublicPath = (path: string) =>
    PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));

export async function proxy(request: NextRequest) {
    const normalizedPath = normalizePath(request.nextUrl.pathname);

    const sessionCookie = request.cookies.get('session')?.value;
    const adminToken = request.cookies.get('admin_session')?.value;
    const userToken = request.cookies.get('user_session')?.value;

    let userData: SessionUser | null = null;
    if (sessionCookie) {
        userData = (await decodeSessionValue(sessionCookie)) as SessionUser | null;
    }

    const role = userData?.role;
    const hasValidRole = isSessionRole(role);
    const agentName = (userData?.displayName || userData?.username || '').toString().trim();
    const hasValidAgentIdentity = role !== 'agent' || !!agentName;
    const hasValidSession = hasValidRole && hasValidAgentIdentity;
    const hasLegacyCookies = Boolean(adminToken || userToken);
    const shouldClearStaleAuthCookies = !hasValidSession && (Boolean(sessionCookie) || hasLegacyCookies);

    const isLoggedInAsAdmin = hasValidSession && role === 'admin';
    const isLoggedInAsAgent = hasValidSession && role === 'agent';
    const isLoggedInAsTeamleiter = hasValidSession && role === 'user';
    const isLoggedIn = isLoggedInAsAdmin || isLoggedInAsAgent || isLoggedInAsTeamleiter;

    const agentHomePath = agentName ? `/agent/${encodeURIComponent(agentName)}` : '/agent';
    const normalizedAgentHomePath = normalizePath(agentHomePath);
    const withCleanup = (response: NextResponse) =>
        shouldClearStaleAuthCookies ? clearAuthCookies(response) : response;
    const allowRequest = () => withCleanup(NextResponse.next());
    const redirectTo = (path: string) => {
        const targetPath = normalizePath(path);
        if (targetPath === normalizedPath) {
            return allowRequest();
        }
        return withCleanup(NextResponse.redirect(new URL(targetPath, request.url)));
    };

    // Öffentliche Seiten - immer erlauben
    if (isPublicPath(normalizedPath)) {
        // Login: Eingeloggte User zur jeweiligen Startseite weiterleiten
        if (normalizedPath === '/login' || normalizedPath === '/agent') {
            if (isLoggedInAsAdmin) return redirectTo('/');
            if (isLoggedInAsAgent) return redirectTo(normalizedAgentHomePath);
            if (isLoggedInAsTeamleiter) return redirectTo('/user');
        }
        return allowRequest();
    }

    // Alle anderen Seiten sind geschützt
    if (!isLoggedIn) {
        if (normalizedPath.startsWith('/agent/')) {
            return redirectTo('/agent');
        }
        if (!normalizedPath.includes('.')) {
            return redirectTo('/login');
        }
        return allowRequest();
    }

    // Admin bleibt im Admin-Bereich
    if (isLoggedInAsAdmin) {
        if (isTeamleiterPath(normalizedPath) || isAgentAreaPath(normalizedPath)) {
            return redirectTo('/');
        }
        return allowRequest();
    }

    // Agent: /agent/<name>, /agent/settings plus Empfehlungsseiten
    if (isLoggedInAsAgent) {
        if (normalizedPath === '/referrals') {
            return redirectTo('/agent/referrals');
        }

        const isAgentAllowedPath =
            normalizedPath.startsWith('/agent/') ||
            normalizedPath === '/agent/settings' ||
            normalizedPath === '/referral-entry';

        if (normalizedPath === '/' || !isAgentAllowedPath) {
            return redirectTo(normalizedAgentHomePath);
        }
        if (normalizedPath === '/agent') {
            return redirectTo(normalizedAgentHomePath);
        }
        if (
            normalizedPath.startsWith('/agent/') &&
            normalizedPath !== '/agent/settings' &&
            normalizedPath !== '/agent/referrals' &&
            normalizedPath !== normalizedAgentHomePath
        ) {
            return redirectTo(normalizedAgentHomePath);
        }
        return allowRequest();
    }

    // Teamleiter: nur /user und /user/settings
    if (isLoggedInAsTeamleiter) {
        if (normalizedPath === '/') {
            return redirectTo('/user');
        }
        if (!isTeamleiterPath(normalizedPath)) {
            return redirectTo('/user');
        }
    }

    return allowRequest();
}

export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*).*)',
        '/login',
        '/agent'
    ],
};
