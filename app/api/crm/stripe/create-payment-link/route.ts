import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getStripe, hasStripe } from '@/lib/stripe';
import { requireSessionUser } from '@/lib/access';

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        if (!hasStripe()) {
            return NextResponse.json(
                { error: 'Stripe ist nicht konfiguriert. Bitte STRIPE_SECRET_KEY in den Umgebungsvariablen hinterlegen.' },
                { status: 400 }
            );
        }

        const stripe = getStripe()!;
        const body = await request.json();
        const { invoice_id } = body;

        if (!invoice_id) {
            return NextResponse.json({ error: 'invoice_id fehlt' }, { status: 400 });
        }

        // Rechnung laden
        const invResult = await query('SELECT * FROM "crm_invoices" WHERE id = $1', [invoice_id]);
        if (invResult.rows.length === 0) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }

        const invoice = invResult.rows[0];
        const amount = Math.round(parseFloat(invoice.total_amount) * 100); // Cent

        if (amount <= 0) {
            return NextResponse.json({ error: 'Betrag muss groesser als 0 sein' }, { status: 400 });
        }

        // Items laden für Beschreibung
        const itemsResult = await query('SELECT title, quantity, unit_price FROM "crm_invoice_items" WHERE invoice_id = $1', [invoice_id]);
        const lineDesc = itemsResult.rows.map((it: any) =>
            `${it.title} x${it.quantity}`
        ).join(', ') || `Rechnung ${invoice.invoice_number}`;

        // Stripe Checkout Session erstellen
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
            success_url: `${origin}/crm?payment=success&invoice=${invoice.invoice_number}`,
            cancel_url: `${origin}/crm?payment=cancelled&invoice=${invoice.invoice_number}`,
        });

        // Payment Link in DB speichern und Status auf Offen setzen
        await query(
            `UPDATE "crm_invoices" 
             SET stripe_session_id = $1, stripe_payment_link = $2, payment_method = 'stripe', status = 'Offen'
             WHERE id = $3`,
            [session.id, session.url, invoice_id]
        );

        return NextResponse.json({
            success: true,
            payment_url: session.url,
            session_id: session.id,
        });
    } catch (error: any) {
        console.error('Stripe Payment Link Error:', error);
        return NextResponse.json(
            { error: 'Stripe Payment Link konnte nicht erstellt werden', details: error.message },
            { status: 500 }
        );
    }
}
