import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        // Rechnung laden, nur öffentliche Felder
        const invResult = await query(
            `SELECT id, invoice_number, doc_type, customer_name, total_amount, status, created_at, due_date, notes 
             FROM "crm_invoices" WHERE id = $1`, 
            [id]
        );
        
        if (invResult.rows.length === 0) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }

        const invoice = invResult.rows[0];

        // Items laden
        const itemsResult = await query(
            `SELECT title, description, quantity, unit_price, total_price 
             FROM "crm_invoice_items" WHERE invoice_id = $1`, 
            [id]
        );

        // Stripe Public Key für Client-side Redirects lesen
        const stripePkResult = await query(
            `SELECT value FROM "crm_settings" WHERE key = 'stripe_publishable_key' LIMIT 1`
        );
        
        const paypalClientIdResult = await query(
            `SELECT value FROM "crm_settings" WHERE key = 'paypal_client_id' LIMIT 1`
        );

        return NextResponse.json({
            invoice,
            items: itemsResult.rows,
            stripe_publishable_key: stripePkResult.rows[0]?.value || '',
            paypal_client_id: paypalClientIdResult.rows[0]?.value || '',
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Fehler beim Laden', details: error.message }, { status: 500 });
    }
}
