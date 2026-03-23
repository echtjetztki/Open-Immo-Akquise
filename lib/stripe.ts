import Stripe from 'stripe';
import { query } from '@/lib/db';

// Stripe-Key aus DB (crm_settings) lesen
async function getStripeSecretKey(): Promise<string | null> {
    try {
        const result = await query(
            `SELECT value FROM "crm_settings" WHERE key = 'stripe_secret_key' LIMIT 1`
        );
        const val = result.rows[0]?.value?.trim();
        return val || null;
    } catch {
        return null;
    }
}

export async function getStripeFromDb(): Promise<Stripe | null> {
    const key = await getStripeSecretKey();
    if (!key) return null;
    return new Stripe(key);
}

export async function hasStripeConfigured(): Promise<boolean> {
    const key = await getStripeSecretKey();
    return !!key;
}

// Fallback: ENV-Variable (fuer Webhook-Verifizierung etc.)
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    if (!stripeInstance) {
        stripeInstance = new Stripe(key);
    }
    return stripeInstance;
}

export function hasStripe(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
}
