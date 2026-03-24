import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getStripeFromDb } from '@/lib/stripe';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { invoice_id } = body;

        if (!invoice_id) {
            return NextResponse.json({ error: 'invoice_id fehlt' }, { status: 400 });
        }

        const stripe = await getStripeFromDb();
        if (!stripe) {
            return NextResponse.json({ error: 'Stripe ist nicht konfiguriert.' }, { status: 500 });
        }

        // Rechnung laden
        const invResult = await query('SELECT * FROM "crm_invoices" WHERE id = $1', [invoice_id]);
        if (invResult.rows.length === 0) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }

        const invoice = invResult.rows[0];
        const amount = Math.round(parseFloat(invoice.total_amount) * 100); // Cent

        // Items laden für Beschreibung
        const itemsResult = await query('SELECT title, quantity, unit_price FROM "crm_invoice_items" WHERE invoice_id = $1', [invoice_id]);
        const lineDesc = itemsResult.rows.map((it: any) =>
            `${it.title} x${it.quantity}`
        ).join(', ') || `Rechnung ${invoice.invoice_number}`;

        const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'sepa_debit'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Rechnung ${invoice.invoice_number}`,
                        description: lineDesc.substring(0, 250),
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            metadata: {
                invoice_id: invoice.id.toString(),
                invoice_number: invoice.invoice_number,
            },
            customer_email: invoice.customer_email || undefined,
            success_url: `${origin}/payment/${invoice.id}?status=success`,
            cancel_url: `${origin}/payment/${invoice.id}?status=cancelled`,
        });

        // Payment Link in DB speichern
        await query(
            `UPDATE "crm_invoices" 
             SET stripe_session_id = $1, stripe_payment_link = $2, payment_method = 'stripe', status = 'Offen'
             WHERE id = $3`,
            [session.id, session.url, invoice_id]
        );

        return NextResponse.json({
            success: true,
            payment_url: session.url
        });
    } catch (error: any) {
        console.error('Public Stripe Payment Link Error:', error);
        return NextResponse.json(
            { error: 'Fehler beim Erstellen des Stripe Checkout Links' },
            { status: 500 }
        );
    }
}
