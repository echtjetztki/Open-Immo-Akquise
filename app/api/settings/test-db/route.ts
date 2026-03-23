import { NextResponse } from 'next/server';
import { getDatabaseSource, hasDatabaseUrl, query } from '@/lib/db';
import { requireSessionUser } from '@/lib/access';

interface LogEntry {
    step: string;
    status: 'success' | 'error' | 'info';
    message: string;
    duration_ms?: number;
    timestamp: string;
}

export async function GET() {
    const access = await requireSessionUser(['admin']);
    if (!access.ok) {
        return access.response;
    }

    const logs: LogEntry[] = [];
    const totalStart = Date.now();

    const addLog = (step: string, status: LogEntry['status'], message: string, duration_ms?: number) => {
        logs.push({
            step,
            status,
            message,
            duration_ms,
            timestamp: new Date().toISOString(),
        });
    };

    try {
        const envStart = Date.now();
        const hasDbUrl = hasDatabaseUrl();
        const dbSource = getDatabaseSource();
        addLog(
            'Environment',
            hasDbUrl ? 'success' : 'error',
            hasDbUrl
                ? `Verbindung über ${dbSource} konfiguriert`
                : 'Keine SUPABASE_DATABASE_URL oder SUPABASE_DB_URL gefunden',
            Date.now() - envStart
        );

        if (!hasDbUrl) {
            return NextResponse.json({
                success: false,
                message: 'Keine Supabase-Datenbank-URL konfiguriert',
                logs,
                total_duration_ms: Date.now() - totalStart,
            }, { status: 500 });
        }

        const connStart = Date.now();
        await query('SELECT 1 as test');
        addLog('Verbindung', 'success', 'Verbindung zur Datenbank hergestellt', Date.now() - connStart);

        const versionStart = Date.now();
        const versionResult = await query('SELECT version()');
        const serverVersion = versionResult.rows[0]?.version || 'Unbekannt';
        addLog('Server-Version', 'info', serverVersion, Date.now() - versionStart);

        const dbInfoStart = Date.now();
        const dbInfoResult = await query('SELECT current_database() as db, current_user as user_name, inet_server_addr() as host');
        const dbInfo = dbInfoResult.rows[0];
        addLog('Datenbank-Info', 'info', `DB: ${dbInfo?.db}, User: ${dbInfo?.user_name}`, Date.now() - dbInfoStart);

        const tableStart = Date.now();
        const countResult = await query('SELECT COUNT(*) as count FROM "property-leads"');
        const rowCount = parseInt(countResult.rows[0]?.count || '0', 10);
        addLog('Tabelle property-leads', 'success', `${rowCount} Eintraege gefunden`, Date.now() - tableStart);

        const notesStart = Date.now();
        try {
            const notesCount = await query('SELECT COUNT(*) as count FROM property_notes');
            const notesRowCount = parseInt(notesCount.rows[0]?.count || '0', 10);
            addLog('Tabelle property_notes', 'success', `${notesRowCount} Notizen gefunden`, Date.now() - notesStart);
        } catch {
            addLog('Tabelle property_notes', 'error', 'Tabelle nicht gefunden', Date.now() - notesStart);
        }

        const schemaStart = Date.now();
        const schemaResult = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'property-leads'
            ORDER BY ordinal_position
        `);
        const columns = schemaResult.rows.map((row) => row.column_name);
        const columnDetails = schemaResult.rows.map((row) => ({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === 'YES',
        }));
        addLog('Schema', 'success', `${columns.length} Spalten geladen`, Date.now() - schemaStart);

        const indexStart = Date.now();
        const indexResult = await query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'property-leads'
        `);
        const indexes = indexResult.rows.map((row) => row.indexname);
        addLog('Indexes', 'info', `${indexes.length} Indexes vorhanden: ${indexes.join(', ')}`, Date.now() - indexStart);

        const triggerStart = Date.now();
        const triggerResult = await query(`
            SELECT trigger_name FROM information_schema.triggers
            WHERE event_object_table = 'property-leads'
        `);
        const triggers = triggerResult.rows.map((row) => row.trigger_name);
        addLog(
            'Triggers',
            'info',
            triggers.length > 0 ? `${triggers.length} Trigger aktiv: ${triggers.join(', ')}` : 'Keine Trigger gefunden',
            Date.now() - triggerStart
        );

        const totalDuration = Date.now() - totalStart;
        addLog('Gesamt', 'success', `Alle Tests abgeschlossen in ${totalDuration}ms`, totalDuration);

        return NextResponse.json({
            success: true,
            message: 'Supabase-Datenbank-Verbindung erfolgreich! Alle Tests bestanden.',
            details: {
                tableExists: columns.length > 0,
                rowCount,
                columns,
                columnDetails,
                serverVersion,
                database: dbInfo?.db,
                user: dbInfo?.user_name,
                indexes,
                triggers,
            },
            logs,
            total_duration_ms: totalDuration,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        let enrichedMessage = message;
        
        if (message.includes('Tenant or user not found')) {
            enrichedMessage = `${message}. (Hinweis: Prüfen Sie die SUPABASE_DATABASE_URL. Bei Verwendung des Supabase Poolers (6543) muss der User 'postgres.[PROJEKT-REF]' lauten.)`;
        }

        addLog('Fehler', 'error', enrichedMessage, Date.now() - totalStart);
        console.error('Database test failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: enrichedMessage,
                logs,
                total_duration_ms: Date.now() - totalStart,
            },
            { status: 500 }
        );
    }
}
