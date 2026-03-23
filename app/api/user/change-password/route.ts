import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { sendSecurityWebhook } from '@/lib/security-webhook';
import { blockDemoWrites } from '@/lib/access';
import { hashPassword, verifyPassword } from '@/lib/password';
import { decodeSessionValue } from '@/lib/session';

type SessionUser = {
    userId?: number;
    username?: string;
    displayName?: string;
    role?: string;
};

export async function POST(request: Request) {
    try {
        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) {
            return demoWriteBlock;
        }

        const body = await request.json();
        const currentPassword = (body?.currentPassword ?? '').toString();
        const newPassword = (body?.newPassword ?? '').toString();

        if (!currentPassword || !newPassword) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'missing_password_fields',
                source: 'api/user/change-password'
            });
            return NextResponse.json({ error: 'Bitte aktuelles und neues Passwort eingeben' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'not_authenticated',
                source: 'api/user/change-password'
            });
            return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
        }

        const decodedSession = await decodeSessionValue(session.value);
        if (!decodedSession) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'invalid_session',
                source: 'api/user/change-password'
            });
            return NextResponse.json({ error: 'Sitzung ungueltig' }, { status: 401 });
        }
        const userData: SessionUser = decodedSession;

        const userId = Number(userData.userId);
        const username = (userData.username || '').toString();
        const displayName = (userData.displayName || '').toString();
        const role = (userData.role || '').toString();

        if (!userId) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'missing_user_id_in_session',
                username,
                displayName,
                role,
                source: 'api/user/change-password'
            });
            return NextResponse.json({ error: 'Sitzung ungueltig' }, { status: 401 });
        }

        // Check if the current password is correct.
        const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'user_not_found',
                username,
                displayName,
                role,
                source: 'api/user/change-password',
                metadata: { userId }
            });
            return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
        }

        const user = userRes.rows[0] as { password_hash?: string };
        if (!verifyPassword(currentPassword, user.password_hash ?? '')) {
            await sendSecurityWebhook(request, {
                event: 'password_change_failed',
                reason: 'wrong_current_password',
                username,
                displayName,
                role,
                source: 'api/user/change-password',
                metadata: { userId }
            });
            return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 401 });
        }

        // Update to new password.
        const newPasswordHash = hashPassword(newPassword);
        await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, userId]);
        await sendSecurityWebhook(request, {
            event: 'password_change_success',
            username,
            displayName,
            role,
            source: 'api/user/change-password',
            metadata: { userId }
        });

        return NextResponse.json({ success: true, message: 'Passwort erfolgreich geändert' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Change password error:', error);
        await sendSecurityWebhook(request, {
            event: 'password_change_failed',
            reason: 'server_error',
            error: message,
            source: 'api/user/change-password'
        });
        return NextResponse.json({ error: 'Ein Fehler ist aufgetreten: ' + message }, { status: 500 });
    }
}
