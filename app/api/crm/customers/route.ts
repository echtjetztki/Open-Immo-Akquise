import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET() {
    try {
        const result = await query('SELECT * FROM "crm_customers" ORDER BY created_at DESC');
        return NextResponse.json(result.rows || []);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch customers', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) return demoWriteBlock;

        const body = await request.json();
        if (!body.name) {
            return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
        }

        const sql = `
            INSERT INTO "crm_customers" (name, email, phone, company, address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const params = [body.name, body.email || null, body.phone || null, body.company || null, body.address || null];
        const result = await query(sql, params);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create customer', details: error.message }, { status: 500 });
    }
}
