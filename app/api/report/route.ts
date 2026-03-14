import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - Report property status/note by external_source ID
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { external_id, status, note } = body;

        if (!external_id || !status) {
            return NextResponse.json(
                { error: 'external_source ID and Status are required' },
                { status: 400 }
            );
        }

        // Get IP Address
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

        const sql = `
            INSERT INTO property_reporting (external_id, status, note, ip_address)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await query(sql, [external_id, status, note || null, ip]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error('Failed to report property:', error);
        return NextResponse.json(
            { error: 'Failed to report property', details: error.message },
            { status: 500 }
        );
    }
}

// GET - Get reports for a specific external_source ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const external_id = searchParams.get('external_id');

        if (!external_id) {
            return NextResponse.json(
                { error: 'external_source ID is required' },
                { status: 400 }
            );
        }

        const reportsResult = await query(
            `SELECT * FROM property_reporting
             WHERE external_id = $1
             ORDER BY created_at DESC`,
            [external_id]
        );

        const propertyResult = await query(
            `SELECT title, link FROM "property-leads"
             WHERE external_id = $1
             LIMIT 1`,
            [external_id]
        );

        return NextResponse.json({
            reports: reportsResult.rows,
            property: propertyResult.rows[0] || null
        });
    } catch (error: any) {
        console.error('Failed to fetch reports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports', details: error.message },
            { status: 500 }
        );
    }
}

