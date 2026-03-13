import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { key } = await request.json();
        const inputHash = crypto.createHash('sha256').update(key || '').digest('hex');
        
        // This is the SHA-256 hash of 'wuTK13L6rnLqhRIKgz9Ep2DUtcPUoVxCEBs6bP4thvo'
        const targetHash = process.env.N8N_ACTIVATION_HASH || 'fdba97c867932d653981000d72872a37a8eaf96607135b14c75914a7f73f3';

        if (inputHash === targetHash) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Ungültiger Schlüssel' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
    }
}
