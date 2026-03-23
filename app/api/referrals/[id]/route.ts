import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from('referrals')
            .update(body)
            .eq('id', id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data[0]);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const { error } = await supabase
        .from('referrals')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
