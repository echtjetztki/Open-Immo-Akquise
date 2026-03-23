import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSessionUser } from '@/lib/access';
import { ensureReferralsSchema } from '@/lib/referrals-schema';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    try {
        const access = await requireSessionUser(['admin', 'agent']);
        if (!access.ok) {
            return access.response;
        }

        await ensureReferralsSchema();

        const body = await request.json();
        const updates: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (body?.status !== undefined) {
            updates.push(`status = $${idx++}`);
            values.push((body.status || '').toString().trim());
        }
        if (body?.commission_pct !== undefined) {
            const commissionRaw = Number(body.commission_pct);
            updates.push(`commission_pct = $${idx++}`);
            values.push(Number.isFinite(commissionRaw) && commissionRaw > 0 ? commissionRaw : 10);
        }
        if (body?.notes !== undefined) {
            updates.push(`notes = $${idx++}`);
            values.push((body.notes || '').toString().trim() || null);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Keine aenderbaren Felder uebergeben.' }, { status: 400 });
        }

        let sql = `
            UPDATE public.referrals
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${idx++}
        `;
        values.push(id);

        if (access.user.role === 'agent') {
            if (!access.user.userId) {
                return NextResponse.json({ error: 'Agenten-Session unvollstaendig.' }, { status: 403 });
            }
            sql += ` AND agent_id = $${idx++}`;
            values.push(access.user.userId);
        }

        sql += ` RETURNING *`;

        const result = await query(sql, values);
        if (!result.rows.length) {
            return NextResponse.json({ error: 'Eintrag nicht gefunden oder keine Berechtigung.' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    try {
        const access = await requireSessionUser(['admin', 'agent']);
        if (!access.ok) {
            return access.response;
        }

        await ensureReferralsSchema();

        const values: unknown[] = [id];
        let sql = `DELETE FROM public.referrals WHERE id = $1`;

        if (access.user.role === 'agent') {
            if (!access.user.userId) {
                return NextResponse.json({ error: 'Agenten-Session unvollstaendig.' }, { status: 403 });
            }
            sql += ` AND agent_id = $2`;
            values.push(access.user.userId);
        }

        sql += ` RETURNING id`;

        const result = await query(sql, values);
        if (!result.rows.length) {
            return NextResponse.json({ error: 'Eintrag nicht gefunden oder keine Berechtigung.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
