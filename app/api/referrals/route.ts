import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_name, client_address, client_phone, recommender_name, recommender_email, commission_pct, notes } = body;

        const { data, error } = await supabase
            .from('referrals')
            .insert([{
                client_name,
                client_address,
                client_phone,
                recommender_name,
                recommender_email,
                commission_pct: Number(commission_pct) || 10,
                status: 'Neu'
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
