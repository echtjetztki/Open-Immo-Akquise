import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;
        const demoBlock = blockDemoWrites();
        if (demoBlock) return demoBlock;

        const body = await request.json();
        const { invoiceId, provider } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: 'Rechnungs-ID erforderlich' }, { status: 400 });
        }

        // Load invoice
        const invResult = await query('SELECT * FROM "crm_invoices" WHERE id = $1', [invoiceId]);
        if (invResult.rows.length === 0) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
        }
        const invoice = invResult.rows[0];
        const amount = Number(invoice.total_amount);

        // Load payment settings
        const settingsResult = await query('SELECT key, value FROM "crm_settings" WHERE key LIKE $1 OR key LIKE $2', ['stripe_%', 'paypal_%']);
        const settings: Record<string, string> = {};
        for (const row of settingsResult.rows) {
            settings[row.key as string] = row.value as string;
        }

        if (provider === 'stripe') {
            const stripeKey = settings.stripe_secret_key;
            if (!stripeKey) {
                return NextResponse.json({ error: 'Stripe API Key nicht konfiguriert' }, { status: 400 });
            }

            // Create Stripe Checkout Session
            const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${stripeKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'mode': 'payment',
                    'line_items[0][price_data][currency]': 'eur',
                    'line_items[0][price_data][product_data][name]': `Rechnung ${invoice.invoice_number}`,
                    'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
                    'line_items[0][quantity]': '1',
                    'success_url': `${body.baseUrl || 'https://example.com'}/payment/success?invoice=${invoice.invoice_number}`,
                    'cancel_url': `${body.baseUrl || 'https://example.com'}/payment/cancel`,
                    'metadata[invoice_id]': String(invoice.id),
                    'metadata[invoice_number]': invoice.invoice_number as string,
                }),
            });

            const session = await response.json();
            if (!response.ok) {
                return NextResponse.json({ error: session.error?.message || 'Stripe Fehler' }, { status: 400 });
            }

            return NextResponse.json({ success: true, paymentLink: session.url, provider: 'stripe' });

        } else if (provider === 'paypal') {
            const clientId = settings.paypal_client_id;
            const clientSecret = settings.paypal_secret;
            const sandbox = settings.paypal_sandbox === 'true';

            if (!clientId || !clientSecret) {
                return NextResponse.json({ error: 'PayPal API nicht konfiguriert' }, { status: 400 });
            }

            const baseUrl = sandbox
                ? 'https://api-m.sandbox.paypal.com'
                : 'https://api-m.paypal.com';

            // Get access token
            const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) {
                return NextResponse.json({ error: 'PayPal Authentifizierung fehlgeschlagen' }, { status: 400 });
            }

            // Create order
            const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        reference_id: String(invoice.id),
                        description: `Rechnung ${invoice.invoice_number}`,
                        amount: {
                            currency_code: 'EUR',
                            value: amount.toFixed(2),
                        },
                    }],
                    application_context: {
                        return_url: `${body.baseUrl || 'https://example.com'}/payment/success?invoice=${invoice.invoice_number}`,
                        cancel_url: `${body.baseUrl || 'https://example.com'}/payment/cancel`,
                    },
                }),
            });
            const order = await orderRes.json();
            if (!orderRes.ok) {
                return NextResponse.json({ error: order.message || 'PayPal Fehler' }, { status: 400 });
            }

            const approveLink = order.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href;
            return NextResponse.json({ success: true, paymentLink: approveLink, provider: 'paypal' });

        } else {
            return NextResponse.json({ error: 'Unbekannter Zahlungsanbieter' }, { status: 400 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Payment link error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
