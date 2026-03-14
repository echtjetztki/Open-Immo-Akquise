import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT * FROM "crm_articles" ORDER BY created_at DESC');
        return NextResponse.json(result.rows || []);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch articles', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.title || body.price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sql = `
            INSERT INTO "crm_articles" (title, description, price, unit)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const params = [body.title, body.description || null, parseFloat(body.price), body.unit || 'Stück'];
        const result = await query(sql, params);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create article', details: error.message }, { status: 500 });
    }
}
