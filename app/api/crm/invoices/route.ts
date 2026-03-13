import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT * FROM "crm_invoices" ORDER BY issue_date DESC, created_at DESC');
        return NextResponse.json(result.rows || []);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch invoices', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Very simple insert - this could be wrapped in a transaction
        const sqlInvoice = `
            INSERT INTO "crm_invoices" (invoice_number, customer_name, customer_email, customer_address, total_amount, issue_date, due_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const paramsInvoice = [
            body.invoice_number || `RE-${Date.now()}`,
            body.customer_name,
            body.customer_email || null,
            body.customer_address || null,
            parseFloat(body.total_amount),
            body.issue_date || new Date().toISOString().split('T')[0],
            body.due_date || null,
            body.status || 'Entwurf'
        ];

        const result = await query(sqlInvoice, paramsInvoice);
        const invoice = result.rows[0];

        // Insert items (naive approach for demonstration, in production use transaction)
        if (body.items && body.items.length > 0) {
            for (const item of body.items) {
                const sqlItem = `
                    INSERT INTO "crm_invoice_items" (invoice_id, article_id, title, description, quantity, unit_price, total_price)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                await query(sqlItem, [
                    invoice.id,
                    item.article_id || null,
                    item.title,
                    item.description || null,
                    parseFloat(item.quantity),
                    parseFloat(item.unit_price),
                    parseFloat(item.total_price)
                ]);
            }
        }

        return NextResponse.json(invoice, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create invoice', details: error.message }, { status: 500 });
    }
}
