import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('admin_session');
    cookieStore.delete('user_session');
    cookieStore.delete('basic_license_verified');
    cookieStore.delete('n8n_activated');

    return NextResponse.json({ success: true });
}
