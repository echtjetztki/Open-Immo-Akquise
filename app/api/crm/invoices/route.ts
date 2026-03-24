import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET() {
    try {
        const result = await query(`
            SELECT i.*, 
                (SELECT json_agg(it.*) FROM "crm_invoice_items" it WHERE it.invoice_id = i.id) as items
            FROM "crm_invoices" i
            ORDER BY 
                CASE status 
                    WHEN 'Inkasso' THEN 1
                    WHEN 'Offen' THEN 2
                    WHEN 'Entwurf' THEN 3
                    WHEN 'Bezahlt' THEN 4
                    WHEN 'Storniert' THEN 5
                END,
                issue_date DESC, created_at DESC
        `);
        return NextResponse.json(result.rows || []);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch invoices', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) {
            return access.response;
        }

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) {
            return demoWriteBlock;
        }

        const body = await request.json();

        const sqlInvoice = `
            INSERT INTO "crm_invoices" (invoice_number, doc_type, customer_name, customer_email, customer_address, total_amount, issue_date, due_date, status, payment_method, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const docType = body.doc_type || 'Rechnung';
        const prefix = docType === 'Angebot' ? 'AG' : docType === 'Expose' ? 'EX' : 'RE';

        const paramsInvoice = [
            body.invoice_number || `${prefix}-${Date.now()}`,
            docType,
            body.customer_name,
            body.customer_email || null,
            body.customer_address || null,
            parseFloat(body.total_amount),
            body.issue_date || new Date().toISOString().split('T')[0],
            body.due_date || null,
            body.status || 'Entwurf',
            body.payment_method || null,
            body.notes || null,
        ];

        const result = await query(sqlInvoice, paramsInvoice);
        const invoice = result.rows[0];

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
