import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { key } = await request.json();
        const inputHash = crypto.createHash('sha256').update((key || '').toString()).digest('hex');
        const targetHash = (process.env.N8N_ACTIVATION_HASH || '').trim().toLowerCase();

        if (!targetHash) {
            return NextResponse.json({ success: false, error: 'N8N_ACTIVATION_HASH ist nicht konfiguriert' }, { status: 500 });
        }

        if (inputHash === targetHash) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Ungueltiger Aktivierungscode' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
    }
}
