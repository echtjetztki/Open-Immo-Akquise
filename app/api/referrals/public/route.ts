import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureReferralsSchema } from '@/lib/referrals-schema';

export async function POST(request: Request) {
    try {
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
        if (body?.agent_id !== undefined && body?.agent_id !== null && body?.agent_id !== '') {
            const parsedAgentId = Number(body.agent_id);
            if (Number.isInteger(parsedAgentId) && parsedAgentId > 0) {
                const existsResult = await query('SELECT 1 FROM public.users WHERE id = $1 LIMIT 1', [parsedAgentId]);
                if (existsResult.rows.length > 0) {
                    agentId = parsedAgentId;
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

        return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
