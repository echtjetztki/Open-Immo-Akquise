import { query } from '@/lib/db';

async function getPayPalConfig() {
    const result = await query(
        `SELECT key, value FROM "crm_settings" WHERE key IN ('paypal_client_id', 'paypal_secret', 'paypal_mode')`
    );
    const config: Record<string, string> = {};
    result.rows.forEach(row => {
        config[row.key] = row.value || '';
    });
    return config;
}

export async function getPayPalAccessToken() {
    const config = await getPayPalConfig();
    const clientId = config.paypal_client_id;
    const clientSecret = config.paypal_secret;
    const mode = config.paypal_mode || 'sandbox';

    if (!clientId || !clientSecret) return null;

    const base = mode === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        console.error('PayPal Auth Error:', await res.text());
        return null;
    }

    const data = await res.json();
    return data.access_token;
}

export async function createPayPalOrder(amount: string, invoiceNumber: string) {
    const token = await getPayPalAccessToken();
    if (!token) return null;

    const config = await getPayPalConfig();
    const mode = config.paypal_mode || 'sandbox';
    const base = mode === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';

    const res = await fetch(`${base}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: invoiceNumber,
                amount: {
                    currency_code: 'EUR',
                    value: amount,
                },
                description: `Rechnung ${invoiceNumber}`,
            }],
        }),
    });

    if (!res.ok) {
        console.error('PayPal Order Creation Error:', await res.text());
        return null;
    }

    return res.json();
}

export async function capturePayPalOrder(orderId: string) {
    const token = await getPayPalAccessToken();
    if (!token) return null;

    const config = await getPayPalConfig();
    const mode = config.paypal_mode || 'sandbox';
    const base = mode === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';

    const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) {
        console.error('PayPal Order Capture Error:', await res.text());
        return null;
    }

    return res.json();
}
