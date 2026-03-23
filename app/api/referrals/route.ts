import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSessionUser } from '@/lib/access';
import { ensureReferralsSchema } from '@/lib/referrals-schema';

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

        if (access.user.role === 'agent') {
            if (!access.user.userId) {
                return NextResponse.json({ error: 'Agenten-Session unvollstaendig.' }, { status: 403 });
            }
            sql += ` WHERE r.agent_id = $1`;
            values.push(access.user.userId);
        }

        sql += ` ORDER BY r.created_at DESC`;

        let result = await query(sql, values);

        // Agent demo bootstrap: if an agent has no referrals yet, create a small starter set.
        if (
            access.user.role === 'agent' &&
            access.user.userId &&
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
                    access.user.userId,

                    `${agentName} Demo Lead 2`,
                    'Beispielweg 7, 5020 Salzburg',
                    '+43 660 0000002',
                    `${agentName} (Demo)`,
                    'demo2@example.com',
                    5,
                    'Zweite Demo-Empfehlung (bearbeitbar und loeschbar).',
                    access.user.userId
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

        let agentId: number | null = null;
        if (access.user.role === 'agent') {
            agentId = access.user.userId ?? null;
        } else if (body?.agent_id !== undefined && body?.agent_id !== null && body?.agent_id !== '') {
            const parsedAgentId = Number(body.agent_id);
            if (Number.isInteger(parsedAgentId) && parsedAgentId > 0) {
                agentId = parsedAgentId;
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
