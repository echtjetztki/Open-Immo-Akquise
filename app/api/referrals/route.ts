import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { decodeSessionValue } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = await decodeSessionValue(sessionCookie);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Join with users to get agent name
    let query = supabase
        .from('referrals')
        .select('*, agent:users!referrals_agent_id_fkey(displayName, username)')
        .order('created_at', { ascending: false });

    // Filter by agent if role is agent
    if (session.role === 'agent') {
        query = query.eq('agent_id', session.userId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_name, client_address, client_phone, recommender_name, recommender_email, commission_pct, notes, agent_id } = body;

        const { data, error } = await supabase
            .from('referrals')
            .insert([{
                client_name,
                client_address,
                client_phone,
                recommender_name,
                recommender_email,
                commission_pct: Number(commission_pct) || 10,
                status: 'Neu',
                notes,
                agent_id: agent_id ? Number(agent_id) : null
            }])
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0]);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
