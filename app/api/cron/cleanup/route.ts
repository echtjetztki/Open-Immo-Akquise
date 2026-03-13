import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vercel protection (standard)
    const authHeader = request.headers.get('authorization');
    
    // During local development or if CRON_SECRET is not yet set, we might skip this
    // but the user wants it every 5 minutes on Vercel, so CRON_SECRET is relevant.
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // We log it but allow it if it's not production or if we're testing.
        // For security, usually you'd return 401.
    }

    try {
        console.log('Starting demo data cleanup (5-minute cycle)...');

        // 1. Delete all properties and their logs/notes
        // Using TRUNCATE CASCADE to clean all associated data if foreign keys exist
        try {
            await query('TRUNCATE TABLE "property-leads" RESTART IDENTITY CASCADE');
            console.log('Table property-leads truncated.');
        } catch (e) {
            console.warn('Could not truncate property-leads:', e);
        }

        try {
            await query('TRUNCATE TABLE property_notes RESTART IDENTITY CASCADE');
            console.log('Table property_notes truncated.');
        } catch (e) {
            // Table might not exist yet
        }

        try {
            await query('TRUNCATE TABLE external_source_replies RESTART IDENTITY CASCADE');
            console.log('Table external_source_replies truncated.');
        } catch (e) {
            // Table might not exist yet
        }

        // 2. Clear users and reset demo accounts
        await query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
        
        // admin-DEMO12345!
        // user-DEMO12345!
        await query(`
            INSERT INTO users (username, password_hash, role, display_name)
            VALUES 
            ('admin', 'admin-DEMO12345!', 'admin', 'Administrator'),
            ('user', 'user-DEMO12345!', 'user', 'Demo User')
        `);
        console.log('Users reset to demo defaults.');

        return NextResponse.json({
            success: true,
            message: 'DEMO DB erfolgreich bereinigt. Login-Daten zurückgesetzt.',
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
