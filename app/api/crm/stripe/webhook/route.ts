import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: Request) {
    try {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
            return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 400 });
        }

        const rawBody = await request.text();
        const sig = request.headers.get('stripe-signature');

        // Wenn kein Webhook-Secret konfiguriert, akzeptiere direkt (für Tests)
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event: Stripe.Event;

        if (webhookSecret && sig) {
            const stripe = new Stripe(secret);
            try {
                event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
            } catch (err: any) {
                console.error('Webhook Signatur ungueltig:', err.message);
                return NextResponse.json({ error: 'Ungueltige Signatur' }, { status: 400 });
            }
        } else {
            event = JSON.parse(rawBody) as Stripe.Event;
        }

        // Checkout Session abgeschlossen = Bezahlt
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const invoiceId = session.metadata?.invoice_id;

            if (invoiceId) {
                await query(
                    `UPDATE "crm_invoices" 
                     SET status = 'Bezahlt', paid_at = NOW(), payment_method = 'stripe'
                     WHERE id = $1`,
                    [invoiceId]
                );
                console.log(`Rechnung ${invoiceId} als bezahlt markiert (Stripe Webhook)`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Stripe Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
