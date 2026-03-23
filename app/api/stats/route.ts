import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { decodeSessionValue } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SessionRole = 'admin' | 'user' | 'agent';

type SessionUser = {
    role?: SessionRole;
    displayName?: string;
    username?: string;
};

type StatsPropertyRow = {
    id?: string | number;
    title?: string | null;
    status?: string | null;
    gesamtprovision?: string | number | null;
    berechnung?: string | number | null;
    kaufpreis?: string | number | null;
    provision_abgeber?: string | number | null;
    provision_kaeufer?: string | number | null;
    objekttyp?: string | null;
    betreut_von?: string | null;
    ort?: string | null;
    plz?: string | null;
    link?: string | null;
    email?: string | null;
    telefonnummer?: string | null;
    notizfeld?: string | null;
    uebergeben_am?: string | Date | null;
    tagesdatum?: string | Date | null;
    created_at?: string | Date | null;
    status_changed_at?: string | Date | null;
    [key: string]: unknown;
};

const toNumber = (value: unknown) => Number(value) || 0;

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session) {
            return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
        }

        const decodedSession = await decodeSessionValue(session.value);
        if (!decodedSession) {
            return NextResponse.json({ error: 'Sitzung ungueltig' }, { status: 401 });
        }
        const userData: SessionUser = decodedSession;

        const role = userData.role || 'user';
        const displayName = (userData.displayName || '').toString();
        const username = (userData.username || '').toString();
        const selfName = (displayName || username).trim();

        const { searchParams } = new URL(request.url);
        const agentParam = searchParams.get('agent');
        const isTeamleiterUser = role === 'user' && selfName.toLowerCase() === 'user';

        let queryText = `
            SELECT 
                id, title, status, gesamtprovision, berechnung, kaufpreis,
                provision_abgeber, provision_kaeufer, objekttyp, betreut_von,
                ort, plz, link, email, telefonnummer, notizfeld,
                uebergeben_am, tagesdatum, created_at, status_changed_at
            FROM "property-leads"
        `;

        const params: unknown[] = [];

        if (role === 'admin' || isTeamleiterUser) {
            if (agentParam) {
                queryText += ` WHERE (betreut_von = $1)`;
                params.push(agentParam);
            }
        } else {
            if (!selfName) {
                return NextResponse.json({ error: 'Nicht autorisiert für diesen Benutzer' }, { status: 403 });
            }

            const isOwnAgentPath = agentParam
                ? agentParam.trim().toLowerCase() === selfName.toLowerCase()
                : false;

            if (agentParam && !isOwnAgentPath) {
                return NextResponse.json({ error: 'Nicht autorisiert für diesen Benutzer' }, { status: 403 });
            }

            if (role === 'agent' || agentParam) {
                queryText += ` WHERE (betreut_von = $1)`;
            } else {
                queryText += ` WHERE (betreut_von = $1 OR betreut_von IS NULL OR betreut_von = '')`;
            }
            params.push(selfName);
        }

        queryText += ` ORDER BY created_at DESC`;

        const result = await query(queryText, params);

        const properties: StatsPropertyRow[] = (result.rows || []).map((row: Record<string, unknown>) => {
            const newRow: Record<string, unknown> = { ...row };
            for (const key in newRow) {
                if (typeof newRow[key] === 'bigint') {
                    newRow[key] = String(newRow[key]);
                }
            }
            return newRow as StatsPropertyRow;
        });

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay() + (startOfToday.getDay() === 0 ? -6 : 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const stats = {
            total_properties: properties.length || 0,
            total_commission: 0,
            total_earnings: 0,
            verkauft_count: 0,
            by_status: [] as { status: string; count: number; commission: number; earnings: number }[],
            monthly_sales: [] as { month: string; count: number; commission: number; earnings: number }[],
            by_type: [] as { type: string; count: number; commission: number }[],
            by_agent: [] as { agent: string; count: number; commission: number; earnings: number; verkauft: number }[],
            top_properties: [] as { title: string; kaufpreis: number; gesamtprovision: number; ort: string; status: string }[],
            yearly_comparison: [] as { year: number; count: number; commission: number; earnings: number }[],
            abschluss_total_kaufpreis: 0,
            abschluss_total_commission: 0,
            abschluss_total_earnings: 0,
            new_entries: {
                today: 0,
                this_week: 0,
                this_month: 0,
                last_month: 0,
            },
            export_data: [] as Array<Record<string, string | number>>,
        };

        if (properties.length > 0) {
            stats.total_commission = properties.reduce((sum, prop) => sum + toNumber(prop.gesamtprovision), 0);
            stats.total_earnings = properties.reduce((sum, prop) => sum + toNumber(prop.berechnung), 0);

            const soldProps = properties.filter((prop) => prop.status === 'Abschluss/Verkauf');
            stats.verkauft_count = soldProps.length;
            stats.abschluss_total_kaufpreis = soldProps.reduce((sum, prop) => sum + toNumber(prop.kaufpreis), 0);
            stats.abschluss_total_commission = soldProps.reduce((sum, prop) => sum + toNumber(prop.gesamtprovision), 0);
            stats.abschluss_total_earnings = soldProps.reduce((sum, prop) => sum + toNumber(prop.berechnung), 0);

            properties.forEach((prop) => {
                if (!prop.created_at) {
                    return;
                }
                const d = new Date(prop.created_at);
                if (d >= startOfToday) stats.new_entries.today++;
                if (d >= startOfWeek) stats.new_entries.this_week++;
                if (d >= startOfMonth) stats.new_entries.this_month++;
                if (d >= startOfLastMonth && d <= endOfLastMonth) stats.new_entries.last_month++;
            });

            stats.export_data = properties.map((p) => ({
                ID: Number(p.id) || 0,
                Titel: (p.title || '').toString(),
                Status: (p.status || '').toString(),
                Objekttyp: (p.objekttyp || '').toString(),
                Ort: (p.ort || '').toString(),
                PLZ: (p.plz || '').toString(),
                Kaufpreis: toNumber(p.kaufpreis),
                Gesamtprovision: toNumber(p.gesamtprovision),
                Provision_Abgeber: toNumber(p.provision_abgeber),
                Provision_Kaeufer: toNumber(p.provision_kaeufer),
                Berechnung_10pct: toNumber(p.berechnung),
                Betreut_von: (p.betreut_von || '').toString(),
                Email: (p.email || '').toString(),
                Telefon: (p.telefonnummer || '').toString(),
                Link: (p.link || '').toString(),
                Notiz: (p.notizfeld || '').toString(),
                Uebergeben_am: p.uebergeben_am ? new Date(p.uebergeben_am).toLocaleDateString('de-AT') : '',
                Erfasst_am: p.created_at ? new Date(p.created_at).toLocaleDateString('de-AT') : '',
                Status_geaendert: p.status_changed_at ? new Date(p.status_changed_at).toLocaleDateString('de-AT') : '',
            }));

            const statusMap: Record<string, { count: number; commission: number; earnings: number }> = {};
            properties.forEach((prop) => {
                const statusKey = (prop.status || 'Unbekannt').toString();
                if (!statusMap[statusKey]) {
                    statusMap[statusKey] = { count: 0, commission: 0, earnings: 0 };
                }
                statusMap[statusKey].count++;
                statusMap[statusKey].commission += toNumber(prop.gesamtprovision);
                statusMap[statusKey].earnings += toNumber(prop.berechnung);
            });
            stats.by_status = Object.entries(statusMap).map(([status, data]) => ({ status, ...data }));

            const monthMap: Record<string, { count: number; commission: number; earnings: number }> = {};
            properties.forEach((prop) => {
                if (!prop.created_at) {
                    return;
                }
                const d = new Date(prop.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) {
                    monthMap[key] = { count: 0, commission: 0, earnings: 0 };
                }
                monthMap[key].count++;
                monthMap[key].commission += toNumber(prop.gesamtprovision);
                monthMap[key].earnings += toNumber(prop.berechnung);
            });
            stats.monthly_sales = Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, data]) => ({ month, ...data }));

            const typeMap: Record<string, { count: number; commission: number }> = {};
            properties.forEach((prop) => {
                const typeKey = (prop.objekttyp || 'Unbekannt').toString();
                if (!typeMap[typeKey]) {
                    typeMap[typeKey] = { count: 0, commission: 0 };
                }
                typeMap[typeKey].count++;
                typeMap[typeKey].commission += toNumber(prop.gesamtprovision);
            });
            stats.by_type = Object.entries(typeMap)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([type, data]) => ({ type, ...data }));

            const agentMap: Record<string, { count: number; commission: number; earnings: number; verkauft: number }> = {};
            properties.forEach((prop) => {
                const agentKey = (prop.betreut_von || 'Nicht zugewiesen').toString();
                if (!agentMap[agentKey]) {
                    agentMap[agentKey] = { count: 0, commission: 0, earnings: 0, verkauft: 0 };
                }
                agentMap[agentKey].count++;
                agentMap[agentKey].commission += toNumber(prop.gesamtprovision);
                agentMap[agentKey].earnings += toNumber(prop.berechnung);
                if (prop.status === 'Abschluss/Verkauf') {
                    agentMap[agentKey].verkauft++;
                }
            });
            stats.by_agent = Object.entries(agentMap)
                .sort(([, a], [, b]) => b.commission - a.commission)
                .map(([agent, data]) => ({ agent, ...data }));

            stats.top_properties = [...properties]
                .filter((p) => toNumber(p.kaufpreis) > 0)
                .sort((a, b) => toNumber(b.kaufpreis) - toNumber(a.kaufpreis))
                .slice(0, 10)
                .map((p) => ({
                    title: (p.title || p.ort || 'Ohne Titel').toString(),
                    kaufpreis: toNumber(p.kaufpreis),
                    gesamtprovision: toNumber(p.gesamtprovision),
                    ort: (p.ort || '').toString(),
                    status: (p.status || '').toString(),
                }));

            const yearMap: Record<number, { count: number; commission: number; earnings: number }> = {};
            properties.forEach((prop) => {
                if (!prop.created_at) {
                    return;
                }
                const year = new Date(prop.created_at).getFullYear();
                if (!yearMap[year]) {
                    yearMap[year] = { count: 0, commission: 0, earnings: 0 };
                }
                yearMap[year].count++;
                yearMap[year].commission += toNumber(prop.gesamtprovision);
                yearMap[year].earnings += toNumber(prop.berechnung);
            });
            stats.yearly_comparison = Object.entries(yearMap)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([year, data]) => ({ year: Number(year), ...data }));
        }

        return NextResponse.json(stats);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Failed to fetch stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics', details: message },
            { status: 500 }
        );
    }
}

