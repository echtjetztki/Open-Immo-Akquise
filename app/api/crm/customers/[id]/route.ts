import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await query('SELECT * FROM "crm_customers" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch customer', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) return demoWriteBlock;

        const { id } = await params;
        const body = await request.json();

        const sql = `
            UPDATE "crm_customers"
            SET name = $1, email = $2, phone = $3, company = $4, address = $5
            WHERE id = $6
            RETURNING *
        `;
        const p = [body.name, body.email || null, body.phone || null, body.company || null, body.address || null, id];
        const result = await query(sql, p);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update customer', details: error.message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) return demoWriteBlock;

        const { id } = await params;
        await query('DELETE FROM "crm_customers" WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete customer', details: error.message }, { status: 500 });
    }
}
