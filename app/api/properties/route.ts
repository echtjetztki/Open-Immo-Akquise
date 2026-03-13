import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SessionRole = 'admin' | 'user' | 'agent';

type SessionUser = {
    role?: SessionRole;
    username?: string;
    displayName?: string;
};

type PropertyRow = Record<string, unknown> & {
    external_id?: string;
    reply_message?: string;
};

// GET - List all properties with optional filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        let userData: SessionUser | null = null;
        if (session) {
            try {
                userData = JSON.parse(session.value);
            } catch (e: unknown) {
                console.error('Session parse error:', e);
            }
        }
        const role = userData?.role;
        const selfName = (userData?.displayName || userData?.username || '').toString().trim();
        const isTeamleiterUser =
            role === 'user' &&
            selfName.toLowerCase() === 'user';

        let sql = `
            SELECT p.*
            FROM "property-leads" p
            WHERE 1=1
        `;
        const params: unknown[] = [];
        let paramIndex = 1;

        const agentParam = searchParams.get('agent');

        // --- AUTH & PARAM FILTERING ---
        if (userData && (role === 'admin' || isTeamleiterUser)) {
            if (agentParam) {
                sql += ` AND (p.betreut_von = $${paramIndex})`;
                params.push(agentParam);
                paramIndex++;
            }
        } else if (userData) {
            if (!selfName) {
                return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
            }

            // Non-admins only see their own.
            const isOwnAgentPath = agentParam
                ? agentParam.trim().toLowerCase() === selfName.toString().trim().toLowerCase()
                : false;
            if (agentParam && !isOwnAgentPath) {
                return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
            }

            // Agents always get strict own-object filtering.
            // Legacy non-admin users keep fallback behavior on generic /user.
            if (role === 'agent' || agentParam) {
                sql += ` AND (p.betreut_von = $${paramIndex})`;
            } else {
                sql += ` AND (p.betreut_von = $${paramIndex} OR p.betreut_von IS NULL OR p.betreut_von = '')`;
            }
            params.push(selfName);
            paramIndex++;
        }

        // Filter by status if provided
        if (status) {
            sql += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Search logic
        if (search) {
            const searchTerm = `%${search}%`;

            // Build SQL query for search
            sql += ` AND (
                p.external_id ILIKE $${paramIndex} 
                OR p.title ILIKE $${paramIndex} 
                OR p.notizfeld ILIKE $${paramIndex}
                OR p.ort ILIKE $${paramIndex}
                OR p.betreut_von ILIKE $${paramIndex}
                OR p.plz ILIKE $${paramIndex}
            )`;
            params.push(searchTerm);
            paramIndex++;
        }

        sql += ` ORDER BY uebergeben_am DESC`;

        const result = await query(sql, params);
        // Map over rows and convert any BigInt to strings to prevent JSON serialization errors
        const properties: PropertyRow[] = (result.rows || []).map((row: Record<string, unknown>) => {
            const newRow: Record<string, unknown> = { ...row };
            for (const key in newRow) {
                if (typeof newRow[key] === 'bigint') {
                    newRow[key] = String(newRow[key]);
                }
            }
            return newRow as PropertyRow;
        });

        // 3. Enrichment: Fetch latest messages from Supabase (Fault Tolerant)
        if (properties.length > 0) {
            try {
                const allexternal_sourceIds = properties
                    .map((p) => (typeof p.external_id === 'string' ? p.external_id : ''))
                    .filter((id): id is string => Boolean(id));
                if (allexternal_sourceIds.length > 0) {
                    const uniqueIds = Array.from(new Set(allexternal_sourceIds.map((id) => id.trim())));
                    if (uniqueIds.length > 0) {
                        // Supabase Query for latest replies
                        const latestRepliesRes = await query(`
                        SELECT DISTINCT ON (external_source_code) external_source_code, reply_message 
                        FROM external_source_replies 
                        WHERE external_source_code IN (${uniqueIds.map((_, i) => `$${i + 1}`).join(',')}) 
                        ORDER BY external_source_code, created_at DESC
                    `, uniqueIds);

                        const repliesMap = new Map<string, string>();
                        latestRepliesRes.rows.forEach((r: Record<string, unknown>) => {
                            const external_sourceCode = typeof r.external_source_code === 'string' ? r.external_source_code.trim() : '';
                            const replyMessage = typeof r.reply_message === 'string' ? r.reply_message : '';
                            if (external_sourceCode && replyMessage) {
                                repliesMap.set(external_sourceCode, replyMessage);
                            }
                        });

                        properties.forEach((p) => {
                            const whId = (typeof p.external_id === 'string' ? p.external_id : '').trim();
                            const reply = repliesMap.get(whId);
                            if (reply) {
                                p.reply_message = reply;
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Reply enrichment failed (ignoring):', err);
            }
        }

        return NextResponse.json(properties);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Failed to fetch properties:', error);
        return NextResponse.json(
            { error: 'Failed to fetch properties', details: message },
            { status: 500 }
        );
    }
}

// POST - Create new property
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validation
        if (!body.link || !body.uebergeben_am || body.kaufpreis === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: link, uebergeben_am, kaufpreis' },
                { status: 400 }
            );
        }

        // Prepare data for insertion
        const sql = `
            INSERT INTO "property-leads" (
                link, title, external_id, uebergeben_am, status,
                kaufpreis, email, telefonnummer, objekttyp, plz, ort, betreut_von,
                provision_abgeber_custom, provision_kaeufer_custom, notizfeld, tagesdatum
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const params = [
            body.link,
            body.title || null,
            body.external_id || null,
            body.uebergeben_am,
            body.status || 'Zu vergeben',
            parseFloat(body.kaufpreis),
            body.email || null,
            body.telefonnummer || null,
            body.objekttyp || 'Kauf',
            body.plz || null,
            body.ort || null,
            body.betreut_von || null,
            body.provision_abgeber_custom || null,
            body.provision_kaeufer_custom || null,
            body.notizfeld || null,
            new Date().toISOString().split('T')[0]
        ];

        const result = await query(sql, params);
        const newProperty = result.rows[0];
        for (const key in newProperty) {
            if (typeof newProperty[key] === 'bigint') {
                newProperty[key] = newProperty[key].toString();
            }
        }

        // Telegram Notification (use stringified property)
        const message = `🏢 <b>Neue Immobilie angelegt</b>\n\n` +
            `<b>Titel:</b> ${newProperty.title || 'Kein Titel'}\n` +
            `<b>external_source ID:</b> ${newProperty.external_id || 'N/A'}\n` +
            `<b>Typ:</b> ${newProperty.objekttyp}\n` +
            `<b>Ort:</b> ${[newProperty.plz, newProperty.ort].filter(Boolean).join(' ') || '-'}\n` +
            `<b>Kaufpreis:</b> ${Number(newProperty.kaufpreis).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €\n` +
            `<b>Status:</b> ${newProperty.status}\n\n` +
            `<a href="${newProperty.link}">🔍 Anzeige ansehen</a>`;

        await sendTelegramNotification(message);

        return NextResponse.json(newProperty, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Failed to create property:', error);
        return NextResponse.json(
            { error: 'Failed to create property', details: message },
            { status: 500 }
        );
    }
}

