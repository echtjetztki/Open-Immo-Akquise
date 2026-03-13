import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch single property
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await query(
            `SELECT * FROM "property-Open-Akquise" WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Property not found' },
                { status: 404 }
            );
        }

        const property = result.rows[0];
        // Convert any BigInt fields to strings for JSON serialization
        for (const key in property) {
            if (typeof property[key] === 'bigint') {
                property[key] = property[key].toString();
            }
        }

        // Fetch ALL replies history for this property
        if (property.property_id) {
            try {
                const whCode = (property.property_id || '').trim();
                const repliesResult = await query(
                    `SELECT * FROM property_replies 
                     WHERE property_code = $1 
                     ORDER BY created_at DESC`,
                    [whCode]
                );
                property.replies = (repliesResult.rows || []).map((r: any) => {
                    const row = { ...r };
                    for (const key in row) {
                        if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                    }
                    return row;
                });
                // Also set latest reply_message for convenience if needed
                property.reply_message = property.replies[0]?.reply_message || null;
            } catch (err) {
                console.error('Replies fetch failed for property:', err);
                property.replies = [];
            }

            // NEW: Fetch property_reporting history
            try {
                const whId = (property.property_id || '').trim();
                const reportsResult = await query(
                    `SELECT * FROM property_reporting 
                     WHERE property_id = $1 
                     ORDER BY created_at DESC`,
                    [whId]
                );
                property.reports = (reportsResult.rows || []).map((r: any) => {
                    const row = { ...r };
                    for (const key in row) {
                        if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                    }
                    return row;
                });
            } catch (err) {
                console.error('Reporting history fetch failed for property:', err);
                property.reports = [];
            }
        }

        return NextResponse.json(property);
    } catch (error: any) {
        console.error('Failed to fetch property:', error);
        return NextResponse.json(
            { error: 'Failed to fetch property', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update property
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (body.link !== undefined) {
            updates.push(`link = $${paramIndex}`);
            values.push(body.link);
            paramIndex++;
        }
        if (body.title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            values.push(body.title);
            paramIndex++;
        }
        if (body.property_id !== undefined) {
            updates.push(`property_id = $${paramIndex}`);
            values.push(body.property_id);
            paramIndex++;
        }
        if (body.uebergeben_am !== undefined) {
            updates.push(`uebergeben_am = $${paramIndex}`);
            values.push(body.uebergeben_am);
            paramIndex++;
        }
        if (body.status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(body.status);
            paramIndex++;
        }
        if (body.kaufpreis !== undefined) {
            updates.push(`kaufpreis = $${paramIndex}`);
            values.push(parseFloat(body.kaufpreis));
            paramIndex++;
        }
        if (body.notizfeld !== undefined) {
            updates.push(`notizfeld = $${paramIndex}`);
            values.push(body.notizfeld);
            paramIndex++;
        }
        if (body.email !== undefined) {
            updates.push(`email = $${paramIndex}`);
            values.push(body.email);
            paramIndex++;
        }
        if (body.telefonnummer !== undefined) {
            updates.push(`telefonnummer = $${paramIndex}`);
            values.push(body.telefonnummer);
            paramIndex++;
        }
        if (body.objekttyp !== undefined) {
            updates.push(`objekttyp = $${paramIndex}`);
            values.push(body.objekttyp);
            paramIndex++;
        }
        if (body.plz !== undefined) {
            updates.push(`plz = $${paramIndex}`);
            values.push(body.plz);
            paramIndex++;
        }
        if (body.ort !== undefined) {
            updates.push(`ort = $${paramIndex}`);
            values.push(body.ort);
            paramIndex++;
        }
        if (body.betreut_von !== undefined) {
            updates.push(`betreut_von = $${paramIndex}`);
            values.push(body.betreut_von);
            paramIndex++;
        }
        if (body.provision_abgeber_custom !== undefined) {
            updates.push(`provision_abgeber_custom = $${paramIndex}`);
            values.push(body.provision_abgeber_custom);
            paramIndex++;
        }
        if (body.provision_kaeufer_custom !== undefined) {
            updates.push(`provision_kaeufer_custom = $${paramIndex}`);
            values.push(body.provision_kaeufer_custom);
            paramIndex++;
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        values.push(id); // Add id as the last parameter

        const sql = `
            UPDATE "property-Open-Akquise"
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Property not found' },
                { status: 404 }
            );
        }

        const updatedProperty = result.rows[0];
        for (const key in updatedProperty) {
            if (typeof updatedProperty[key] === 'bigint') {
                updatedProperty[key] = updatedProperty[key].toString();
            }
        }
        return NextResponse.json(updatedProperty);
    } catch (error: any) {
        console.error('Failed to update property:', error);
        return NextResponse.json(
            { error: 'Failed to update property', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete property
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await query(
            `DELETE FROM "property-Open-Akquise" WHERE id = $1`,
            [id]
        );

        return NextResponse.json({ success: true, message: 'Property deleted' });
    } catch (error: any) {
        console.error('Failed to delete property:', error);
        return NextResponse.json(
            { error: 'Failed to delete property', details: error.message },
            { status: 500 }
        );
    }
}
