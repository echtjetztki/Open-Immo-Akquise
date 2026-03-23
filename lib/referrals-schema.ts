import { query } from '@/lib/db';

let referralsSchemaPromise: Promise<void> | null = null;

export async function ensureReferralsSchema(): Promise<void> {
    if (referralsSchemaPromise) {
        return referralsSchemaPromise;
    }

    referralsSchemaPromise = (async () => {
        await query(`
            CREATE TABLE IF NOT EXISTS public.referrals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_name TEXT NOT NULL,
                client_address TEXT,
                client_phone TEXT,
                recommender_name TEXT NOT NULL,
                recommender_email TEXT,
                commission_pct NUMERIC DEFAULT 10,
                status TEXT DEFAULT 'Neu',
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                agent_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
            )
        `);

        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS client_name TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS client_address TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS client_phone TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS recommender_name TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS recommender_email TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS commission_pct NUMERIC DEFAULT 10`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Neu'`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS notes TEXT`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
        await query(`ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL`);

        await query(`CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals (created_at DESC)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_referrals_agent_id ON public.referrals (agent_id)`);
    })().catch((error) => {
        referralsSchemaPromise = null;
        throw error;
    });

    return referralsSchemaPromise;
}
