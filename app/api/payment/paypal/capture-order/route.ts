import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';

export async function POST(request: Request) {
    try {
        const { orderID, invoice_id } = await request.json();
        const res = await capturePayPalOrder(orderID);
        
        if (!res || res.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'PayPal Order Capture failed' }, { status: 500 });
        }
        
        // Update die Rechnung auf Bezahlt
        await query(
            `UPDATE "crm_invoices" SET status = 'Bezahlt', paid_at = NOW(), payment_method = 'paypal' WHERE id = $1`, 
            [invoice_id]
        );
        
        return NextResponse.json({ success: true, status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
