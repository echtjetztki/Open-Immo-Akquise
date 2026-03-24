import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(request: Request) {
    try {
        const { invoice_id } = await request.json();
        
        const invResult = await query('SELECT total_amount, invoice_number FROM "crm_invoices" WHERE id = $1', [invoice_id]);
        if (invResult.rows.length === 0) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }
        
        const invoice = invResult.rows[0];
        const res = await createPayPalOrder(invoice.total_amount, invoice.invoice_number);
        
        if (!res || !res.id) {
            return NextResponse.json({ error: 'PayPal Order Creation failed' }, { status: 500 });
        }
        
        // Speichere die Order ID in der Datenbank
        await query(
            `UPDATE "crm_invoices" SET payment_method = 'paypal', stripe_session_id = $1 WHERE id = $2`, 
            [res.id, invoice_id]
        );
        
        return NextResponse.json({ id: res.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
