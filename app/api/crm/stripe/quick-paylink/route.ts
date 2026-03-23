import { NextResponse } from 'next/server';
import { getStripeFromDb } from '@/lib/stripe';
import { requireSessionUser } from '@/lib/access';

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        const stripe = await getStripeFromDb();
        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe ist nicht konfiguriert. Bitte Stripe Secret Key in den CRM-Einstellungen hinterlegen.' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { amount, description, customer_email } = body;

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Betrag muss groesser als 0 sein' }, { status: 400 });
        }

        const amountCents = Math.round(parseFloat(amount) * 100);

        const origin = process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'sepa_debit'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: description || 'Zahlung',
                    },
                    unit_amount: amountCents,
                },
                quantity: 1,
            }],
            customer_email: customer_email || undefined,
            success_url: `${origin}/crm?payment=success`,
            cancel_url: `${origin}/crm?payment=cancelled`,
        });

        return NextResponse.json({
            success: true,
            payment_url: session.url,
            session_id: session.id,
            amount: parseFloat(amount),
        });
    } catch (error: any) {
        console.error('Stripe PayLink Error:', error);
        return NextResponse.json(
            { error: 'PayLink konnte nicht erstellt werden', details: error.message },
            { status: 500 }
        );
    }
}
