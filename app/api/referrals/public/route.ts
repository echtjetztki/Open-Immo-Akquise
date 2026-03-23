import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        return NextResponse.json({ success: true, data: data[0] });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
