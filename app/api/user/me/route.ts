import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeSessionValue } from '@/lib/session';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session) {
            return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
        }

        const userData = await decodeSessionValue(session.value);
        if (!userData) {
            return NextResponse.json({ error: 'Sitzung ungueltig' }, { status: 401 });
        }

        return NextResponse.json(userData);
    } catch {
        return NextResponse.json({ error: 'Sitzung ungueltig' }, { status: 401 });
    }
}
