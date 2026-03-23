import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await query(
            `SELECT i.*, 
                    json_agg(json_build_object(
                        'id', it.id, 'title', it.title, 'description', it.description,
                        'quantity', it.quantity, 'unit_price', it.unit_price, 'total_price', it.total_price
                    )) FILTER (WHERE it.id IS NOT NULL) as items
             FROM "crm_invoices" i
             LEFT JOIN "crm_invoice_items" it ON it.invoice_id = i.id
             WHERE i.id = $1
             GROUP BY i.id`,
            [id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fehler', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;
        const demoBlock = blockDemoWrites();
        if (demoBlock) return demoBlock;

        const { id } = await params;
        const body = await request.json();

        const updates: string[] = [];
        const values: any[] = [];
        let idx = 1;

        const allowedFields = ['status', 'doc_type', 'payment_method', 'stripe_payment_link', 'stripe_session_id', 'paid_at', 'notes', 'due_date', 'customer_name', 'customer_email', 'customer_address'];
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`"${field}" = $${idx}`);
                values.push(body[field]);
                idx++;
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 });
        }

        values.push(id);
        const sql = `UPDATE "crm_invoices" SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Update fehlgeschlagen', details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;
        const demoBlock = blockDemoWrites();
        if (demoBlock) return demoBlock;

        const { id } = await params;
        await query('DELETE FROM "crm_invoices" WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Löschen fehlgeschlagen', details: error.message }, { status: 500 });
    }
}
