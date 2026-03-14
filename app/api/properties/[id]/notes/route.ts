import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensurePropertySchema } from '@/lib/property-schema';

// GET - Fetch all notes for a property
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensurePropertySchema();

        const { id } = await params;
        const result = await query(
            `SELECT id, property_id, note_text, created_by, created_at
             FROM property_notes
             WHERE property_id = $1
             ORDER BY created_at DESC`,
            [id]
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Failed to fetch notes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notes', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Add a new note to a property
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensurePropertySchema();

        const { id } = await params;
        const body = await request.json();

        if (!body.note_text || body.note_text.trim() === '') {
            return NextResponse.json(
                { error: 'Note text is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO property_notes (property_id, note_text, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, body.note_text, body.created_by || 'system']
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Failed to create note:', error);
        return NextResponse.json(
            { error: 'Failed to create note', details: error.message },
            { status: 500 }
        );
    }
}
