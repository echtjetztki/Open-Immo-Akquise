import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
    try {
        const sqlPath = path.join(process.cwd(), 'database-crm-schema.sql');
        const sqlFile = fs.readFileSync(sqlPath, 'utf8');

        // Execute schema queries
        await query(sqlFile);

        return NextResponse.json({ success: true, message: 'CRM Database initialized successfully' });
    } catch (error: any) {
        console.error('Failed to initialize CRM database:', error);
        return NextResponse.json({ error: 'Failed to initialize CRM DB', details: error.message }, { status: 500 });
    }
}
