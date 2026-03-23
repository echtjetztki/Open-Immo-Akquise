import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_name, client_address, client_phone, recommender_name, recommender_email, notes, agent_id } = body;

        if (!client_name || !recommender_name) {
            return NextResponse.json({ error: 'Name required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('referrals')
            .insert([{
                client_name,
                client_address: client_address || null,
                client_phone: client_phone || null,
                recommender_name,
                recommender_email: recommender_email || null,
                commission_pct: 10,
                status: 'Neu',
                notes: notes || null,
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
