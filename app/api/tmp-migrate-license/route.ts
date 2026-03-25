import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const sql = `
        -- 8. TABELLEN: Lizenzen & Aktivierung
        CREATE TABLE IF NOT EXISTS public.license_keys (
          id BIGSERIAL PRIMARY KEY,
          code_hash TEXT NOT NULL UNIQUE,
          label TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          max_installations INTEGER,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.license_installations (
          id BIGSERIAL PRIMARY KEY,
          license_key_id BIGINT NOT NULL REFERENCES public.license_keys(id) ON DELETE CASCADE,
          install_host TEXT NOT NULL,
          install_origin TEXT NOT NULL,
          install_path TEXT NOT NULL DEFAULT '/',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE (license_key_id, install_host, install_path)
        );

        CREATE INDEX IF NOT EXISTS license_keys_active_idx ON public.license_keys(is_active);
        CREATE INDEX IF NOT EXISTS license_installations_host_path_idx ON public.license_installations(install_host, install_path);
        `;
        
        console.log('Running migration SQL via API...');
        await query(sql);
        console.log('Migration SUCCESS.');

        return NextResponse.json({ success: true, message: 'License tables created/verified.' });
    } catch (error: any) {
        console.error('Migration FAILED:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
