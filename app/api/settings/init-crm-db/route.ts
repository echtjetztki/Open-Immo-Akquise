import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function GET() {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) {
            return access.response;
        }

        const demoWriteBlock = blockDemoWrites();
        if (demoWriteBlock) {
            return demoWriteBlock;
        }

        const sqlPath = path.join(process.cwd(), 'database-crm-schema.sql');
        const sqlFile = fs.readFileSync(sqlPath, 'utf8');

        // Execute schema queries
        await query(sqlFile);

        return NextResponse.json({ success: true, message: 'CRM Database initialized successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Failed to initialize CRM database:', error);
        return NextResponse.json({ error: 'Failed to initialize CRM DB', details: message }, { status: 500 });
    }
}
