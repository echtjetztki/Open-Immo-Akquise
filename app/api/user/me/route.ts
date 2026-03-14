import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session) {
            return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
        }

        const userData = JSON.parse(session.value);
        return NextResponse.json(userData);
    } catch (error) {
        return NextResponse.json({ error: 'Sitzung ungültig' }, { status: 401 });
    }
}
