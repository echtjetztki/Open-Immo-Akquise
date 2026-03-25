import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) return demoWriteBlock;

        const { id } = await params;
        const body = await request.json();

        const sql = `
            UPDATE "crm_articles"
            SET title = $1, description = $2, price = $3, unit = $4
            WHERE id = $5
            RETURNING *
        `;
        const p = [body.title, body.description || null, parseFloat(body.price), body.unit || 'Stueck', id];
        const result = await query(sql, p);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Artikel nicht gefunden' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update article', details: error.message }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) return demoWriteBlock;

        const { id } = await params;
        await query('DELETE FROM "crm_articles" WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete article', details: error.message }, { status: 500 });
    }
}
