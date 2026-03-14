import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ensureUsersTable, type ManagedUserRole } from '@/lib/users';

const ALLOWED_ROLES: ManagedUserRole[] = ['admin', 'user', 'agent'];
const normalizeRole = (value: unknown): ManagedUserRole =>
    ALLOWED_ROLES.includes(value as ManagedUserRole)
        ? (value as ManagedUserRole)
        : 'user';

// Access Control Helper
async function isAdmin() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) return false;
    try {
        const userData = JSON.parse(session.value);
        return userData.role === 'admin';
    } catch {
        return false;
    }
}

export async function GET() {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    try {
        await ensureUsersTable();
        const result = await query('SELECT id, username, role, display_name, created_at FROM users ORDER BY username ASC');
        return NextResponse.json(result.rows);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('GET /api/admin/users failed:', message);
        return NextResponse.json({ error: 'Benutzer konnten nicht geladen werden', details: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    try {
        await ensureUsersTable();
        const { username, password, role, displayName } = await request.json() as {
            username?: string;
            password?: string;
            role?: string;
            displayName?: string;
        };

        const normalizedUsername = (username ?? '').toString().trim().toLowerCase();
        const normalizedPassword = (password ?? '').toString().trim();
        const normalizedRole = normalizeRole(role);
        const normalizedDisplayName = (displayName ?? '').toString().trim() || normalizedUsername;

        if (!normalizedUsername || !normalizedPassword) {
            return NextResponse.json({ error: 'Benutzername und Passwort sind erforderlich' }, { status: 400 });
        }

        const res = await query(
            'INSERT INTO users (username, password_hash, role, display_name) VALUES ($1, $2, $3, $4) RETURNING id',
            [normalizedUsername, normalizedPassword, normalizedRole, normalizedDisplayName]
        );

        return NextResponse.json({
            success: true,
            userId: res.rows[0].id,
            user: {
                username: normalizedUsername,
                role: normalizedRole,
                displayName: normalizedDisplayName
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        const anyError = error as { code?: string; message?: string };
        if (anyError?.code === '23505' || message.toLowerCase().includes('unique constraint')) {
            return NextResponse.json({ error: 'Benutzername existiert bereits' }, { status: 400 });
        }
        console.error('POST /api/admin/users failed:', message);
        return NextResponse.json({ error: 'Benutzer konnte nicht angelegt werden', details: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    try {
        await ensureUsersTable();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });

        // Prevent deleting the main admin
        const checkRes = await query('SELECT username FROM users WHERE id = $1', [id]);
        if (checkRes.rows[0]?.username === 'admin') {
            return NextResponse.json({ error: 'Der Haupt-Admin kann nicht gelöscht werden' }, { status: 400 });
        }

        await query('DELETE FROM users WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('DELETE /api/admin/users failed:', message);
        return NextResponse.json({ error: 'Benutzer konnte nicht geloescht werden', details: message }, { status: 500 });
    }
}
