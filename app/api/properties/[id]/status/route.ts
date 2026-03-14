import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensurePropertySchema } from '@/lib/property-schema';

// PATCH - Quick status update
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await ensurePropertySchema();

        const { id } = await params;
        const body = await request.json();

        if (!body.status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Validate status value
        const validStatuses = ['NEU', 'Von GP kontaktiert', 'Aufgenommen', 'Vermarktung', 'Abschluss/Verkauf', 'Follow-up', 'Storniert', 'Zu vergeben'];
        if (!validStatuses.includes(body.status)) {
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            );
        }

        // If status is changed to 'Aufgenommen', also update 'uebergeben_am' to today
        const sql = body.status === 'Aufgenommen'
            ? `UPDATE "property-leads" SET status = $1, uebergeben_am = CURRENT_DATE WHERE id = $2 RETURNING *`
            : `UPDATE "property-leads" SET status = $1 WHERE id = $2 RETURNING *`;

        const result = await query(sql, [body.status, id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Property not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Failed to update status:', error);
        return NextResponse.json(
            { error: 'Failed to update status', details: error.message },
            { status: 500 }
        );
    }
}
