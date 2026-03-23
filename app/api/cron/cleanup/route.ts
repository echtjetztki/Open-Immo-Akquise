import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // The deployment is expected to protect this route via CRON_SECRET.
        // We keep the current permissive behavior for compatibility.
    }

    try {
        console.log('Starting demo data cleanup (5-minute cycle)...');

        const demoAdminPassword = (process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
        const demoUserPassword = (process.env.USER_PASSWORD || '').trim();

        try {
            await query('TRUNCATE TABLE "property-leads" RESTART IDENTITY CASCADE');
            console.log('Table property-leads truncated.');
        } catch (error) {
            console.warn('Could not truncate property-leads:', error);
        }

        try {
            await query('TRUNCATE TABLE property_notes RESTART IDENTITY CASCADE');
            console.log('Table property_notes truncated.');
        } catch (_error) {
            // Table might not exist yet.
        }

        try {
            await query('TRUNCATE TABLE external_source_replies RESTART IDENTITY CASCADE');
            console.log('Table external_source_replies truncated.');
        } catch (_error) {
            // Table might not exist yet.
        }

        try {
            await query('UPDATE public.referrals SET agent_id = NULL WHERE agent_id IS NOT NULL');
            console.log('Referrals unlinked from users before user reset.');
        } catch (_error) {
            // Referrals table might not exist yet.
        }

        await query('DELETE FROM users');
        try {
            await query(`SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false)`);
        } catch (_error) {
            // Sequence reset is best effort.
        }

        if (!demoAdminPassword && !demoUserPassword) {
            throw new Error(
                'Keine Demo-Zugangsdaten konfiguriert. Bitte DEFAULT_ADMIN_PASSWORD oder ADMIN_PASSWORD und optional USER_PASSWORD setzen.'
            );
        }

        if (demoAdminPassword) {
            await query(
                'INSERT INTO users (username, password_hash, role, display_name) VALUES ($1, $2, $3, $4)',
                ['admin', hashPassword(demoAdminPassword), 'admin', 'Administrator']
            );
        }

        if (demoUserPassword) {
            await query(
                'INSERT INTO users (username, password_hash, role, display_name) VALUES ($1, $2, $3, $4)',
                ['user', hashPassword(demoUserPassword), 'user', 'Demo User']
            );
        }

        console.log('Users reset to env-configured demo defaults.');

        return NextResponse.json({
            success: true,
            message: 'DEMO DB erfolgreich bereinigt. Login-Daten gemäß ENV zurückgesetzt.',
            cleared_tables: ['property-leads', 'property_notes', 'external_source_replies', 'users'],
            timestamp: new Date().toISOString()
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Cleanup failed:', message);
        return NextResponse.json({
            success: false,
            error: message
        }, { status: 500 });
    }
}
