import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSessionUser } from '@/lib/access';
import { ensureReferralsSchema } from '@/lib/referrals-schema';
import { ensureUsersTable } from '@/lib/users';
import { hashPassword } from '@/lib/password';

const toUsernameSlug = (value: string) => {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return slug || 'agent';
};

type SessionRoleLike = 'admin' | 'user' | 'agent';

const normalizeSessionRole = (value: unknown): SessionRoleLike => {
    if (value === 'admin' || value === 'user' || value === 'agent') {
        return value;
    }
    return 'agent';
};

async function ensureSessionUserForSession(
    user: { userId?: number; displayName?: string; username?: string; role?: string }
): Promise<number | null> {
    const sessionUserId = user.userId;
    if (!sessionUserId) {
        return null;
    }

    await ensureUsersTable();
    const existing = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [sessionUserId]);
    if (existing.rows.length > 0) {
        return sessionUserId;
    }

    const role = normalizeSessionRole(user.role);
    const displayName = (user.displayName || user.username || `${role} ${sessionUserId}`).toString().trim();
    const username = `${toUsernameSlug(user.username || role)}_${sessionUserId}`;
    const passwordHash = hashPassword(`${role}-${sessionUserId}-autogen`);

    await query(
        `INSERT INTO users (id, username, password_hash, role, display_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [sessionUserId, username, passwordHash, role, displayName || username]
    );

    return sessionUserId;
}

export async function GET() {
    try {
        const access = await requireSessionUser(['admin', 'agent']);
        if (!access.ok) {
            return access.response;
        }

        await ensureReferralsSchema();

        const values: unknown[] = [];
        let sql = `
            SELECT
                r.*,
                u.display_name AS agent_display_name,
                u.username AS agent_username
            FROM public.referrals r
            LEFT JOIN public.users u ON u.id = r.agent_id
        `;

        let agentSessionId: number | null = null;
        if (access.user.role === 'agent') {
            if (!access.user.userId) {
                return NextResponse.json({ error: 'Agenten-Session unvollstaendig.' }, { status: 403 });
            }

            agentSessionId = await ensureSessionUserForSession(access.user);
            if (!agentSessionId) {
                return NextResponse.json({ error: 'Agentenprofil konnte nicht initialisiert werden.' }, { status: 500 });
            }

            sql += ` WHERE r.agent_id = $1`;
            values.push(agentSessionId);
        }

        sql += ` ORDER BY r.created_at DESC`;

        let result = await query(sql, values);

        // Agent demo bootstrap: if an agent has no referrals yet, create a small starter set.
        if (
            access.user.role === 'agent' &&
            agentSessionId &&
            result.rows.length === 0
        ) {
            const agentName = (access.user.displayName || access.user.username || 'Agent').toString();
            await query(
                `INSERT INTO public.referrals (
                    client_name,
                    client_address,
                    client_phone,
                    recommender_name,
                    recommender_email,
                    commission_pct,
                    status,
                    notes,
                    agent_id
                ) VALUES
                    ($1,$2,$3,$4,$5,$6,'Neu',$7,$8),
                    ($9,$10,$11,$12,$13,$14,'Kontaktiert',$15,$16)`,
                [
                    `${agentName} Demo Lead 1`,
                    'Musterstrasse 1, 1010 Wien',
                    '+43 660 0000001',
                    `${agentName} (Demo)`,
                    'demo1@example.com',
                    10,
                    'Automatisch erzeugte Demo-Empfehlung fuer den Agentenbereich.',
                    agentSessionId,

                    `${agentName} Demo Lead 2`,
                    'Beispielweg 7, 5020 Salzburg',
                    '+43 660 0000002',
                    `${agentName} (Demo)`,
                    'demo2@example.com',
                    5,
                    'Zweite Demo-Empfehlung (bearbeitbar und loeschbar).',
                    agentSessionId
                ]
            );

            result = await query(sql, values);
        }

        const data = result.rows.map((row: Record<string, unknown>) => {
            const agentDisplayName = (row.agent_display_name || '').toString();
            const agentUsername = (row.agent_username || '').toString();
            const { agent_display_name, agent_username, ...rest } = row;
            return {
                ...rest,
                agent: agentDisplayName || agentUsername
                    ? { displayName: agentDisplayName || undefined, username: agentUsername || undefined }
                    : null
            };
        });

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin', 'agent']);
        if (!access.ok) {
            return access.response;
        }

        await ensureReferralsSchema();

        const body = await request.json();
        const clientName = (body?.client_name || '').toString().trim();
        const clientAddress = (body?.client_address || '').toString().trim();
        const clientPhone = (body?.client_phone || '').toString().trim();
        const recommenderName = (body?.recommender_name || '').toString().trim();
        const recommenderEmail = (body?.recommender_email || '').toString().trim();
        const notes = (body?.notes || '').toString().trim();
        const commissionRaw = Number(body?.commission_pct);
        const commissionPct = Number.isFinite(commissionRaw) && commissionRaw > 0 ? commissionRaw : 10;

        if (!clientName || !recommenderName) {
            return NextResponse.json({ error: 'client_name und recommender_name sind erforderlich.' }, { status: 400 });
        }

        const sessionOwnerId = await ensureSessionUserForSession(access.user);

        let agentId: number | null = null;
        if (access.user.role === 'agent') {
            agentId = sessionOwnerId;
            if (!agentId) {
                return NextResponse.json({ error: 'Agentenprofil konnte nicht initialisiert werden.' }, { status: 500 });
            }
        } else if (body?.agent_id !== undefined && body?.agent_id !== null && body?.agent_id !== '') {
            const parsedAgentId = Number(body.agent_id);
            if (Number.isInteger(parsedAgentId) && parsedAgentId > 0) {
                if (sessionOwnerId && parsedAgentId === sessionOwnerId) {
                    agentId = sessionOwnerId;
                } else {
                    const existsResult = await query('SELECT 1 FROM public.users WHERE id = $1 LIMIT 1', [parsedAgentId]);
                    if (existsResult.rows.length > 0) {
                        agentId = parsedAgentId;
                    }
                }
            }
        }

        const result = await query(
            `INSERT INTO public.referrals (
                client_name,
                client_address,
                client_phone,
                recommender_name,
                recommender_email,
                commission_pct,
                status,
                notes,
                agent_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *`,
            [
                clientName,
                clientAddress || null,
                clientPhone || null,
                recommenderName,
                recommenderEmail || null,
                commissionPct,
                'Neu',
                notes || null,
                agentId
            ]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
