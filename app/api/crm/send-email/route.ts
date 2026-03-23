import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;
        const demoBlock = blockDemoWrites();
        if (demoBlock) return demoBlock;

        const body = await request.json();
        const { invoice_id, custom_to, custom_subject, custom_body } = body;

        let to = custom_to;
        let subject = custom_subject || '';
        let html = custom_body || '';

        // Wenn invoice_id vorhanden, lade Rechnungsdaten
        if (invoice_id) {
            const invResult = await query('SELECT * FROM "crm_invoices" WHERE id = $1', [invoice_id]);
            if (invResult.rows.length === 0) {
                return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
            }
            const inv = invResult.rows[0];
            to = to || inv.customer_email;

            if (!to) {
                return NextResponse.json({ error: 'Keine Empfaenger-E-Mail-Adresse vorhanden' }, { status: 400 });
            }

            // Einstellungen laden fuer Firmennamen
            const settingsResult = await query('SELECT key, value FROM "crm_settings"');
            const settings: Record<string, string> = {};
            for (const row of settingsResult.rows) {
                settings[row.key] = row.value || '';
            }

            const docType = inv.doc_type || 'Rechnung';
            const companyName = settings.companyName || 'Open-Akquise';

            if (!subject) {
                subject = `${docType} ${inv.invoice_number} von ${companyName}`;
            }

            if (!html) {
                const amount = Number(inv.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 });
                let paymentInfo = '';

                if (inv.payment_method === 'stripe' && inv.stripe_payment_link) {
                    paymentInfo = `
                        <div style="margin: 20px 0; padding: 16px; background: #f0f0ff; border-radius: 8px; border: 1px solid #c7c7ff;">
                            <p style="margin: 0 0 8px 0; font-weight: bold; color: #5b21b6;">Online bezahlen:</p>
                            <a href="${inv.stripe_payment_link}" style="display: inline-block; padding: 10px 24px; background: #5b21b6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Jetzt sicher bezahlen
                            </a>
                        </div>
                    `;
                } else if (inv.payment_method === 'vorkasse' && settings.iban) {
                    paymentInfo = `
                        <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #a7f3d0;">
                            <p style="margin: 0 0 4px 0; font-weight: bold; color: #065f46;">Bankverbindung für Überweisung:</p>
                            <p style="margin: 0; font-family: monospace;">IBAN: ${settings.iban}${settings.bic ? '<br>BIC: ' + settings.bic : ''}</p>
                            <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">Verwendungszweck: ${inv.invoice_number}</p>
                        </div>
                    `;
                }

                html = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="border-bottom: 3px solid #2dd4bf; padding-bottom: 16px; margin-bottom: 20px;">
                            <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">${companyName}</h1>
                        </div>
                        <p>Sehr geehrte/r ${inv.customer_name},</p>
                        <p>anbei erhalten Sie ${docType === 'Angebot' ? 'unser Angebot' : docType === 'Expose' ? 'unser Expose' : 'die Rechnung'} <strong>${inv.invoice_number}</strong>.</p>
                        <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 4px 0; color: #666;">Dokument:</td>
                                    <td style="padding: 4px 0; font-weight: bold; text-align: right;">${docType} ${inv.invoice_number}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #666;">Datum:</td>
                                    <td style="padding: 4px 0; text-align: right;">${new Date(inv.issue_date).toLocaleDateString('de-DE')}</td>
                                </tr>
                                ${inv.due_date ? `<tr><td style="padding: 4px 0; color: #666;">Fällig:</td><td style="padding: 4px 0; text-align: right;">${new Date(inv.due_date).toLocaleDateString('de-DE')}</td></tr>` : ''}
                                <tr style="border-top: 2px solid #2dd4bf;">
                                    <td style="padding: 8px 0 4px; font-weight: bold; font-size: 16px;">Gesamtbetrag:</td>
                                    <td style="padding: 8px 0 4px; font-weight: bold; font-size: 16px; text-align: right; color: #2dd4bf;">${amount} EUR</td>
                                </tr>
                            </table>
                        </div>
                        ${paymentInfo}
                        <p style="color: #666; font-size: 13px; margin-top: 30px; padding-top: 16px; border-top: 1px solid #eee;">
                            Mit freundlichen Grüßen<br>
                            <strong>${companyName}</strong><br>
                            ${settings.address ? settings.address + '<br>' : ''}
                            ${settings.city || ''}
                            ${settings.phone ? '<br>Tel: ' + settings.phone : ''}
                        </p>
                    </div>
                `;
            }
        }

        if (!to) {
            return NextResponse.json({ error: 'Empfaenger fehlt' }, { status: 400 });
        }

        const result = await sendEmail({ to, subject, html, text: '' });

        if (result.success) {
            // Status auf Offen setzen wenn noch Entwurf
            if (invoice_id) {
                await query(
                    `UPDATE "crm_invoices" SET status = CASE WHEN status = 'Entwurf' THEN 'Offen' ELSE status END WHERE id = $1`,
                    [invoice_id]
                );
            }
        }
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('E-Mail Fehler:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
