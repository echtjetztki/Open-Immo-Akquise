import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { query } from '@/lib/db';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

interface CrmEmailSettings {
    email_provider: string;
    // SMTP
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_pass: string;
    smtp_secure: string;
    smtp_from_email: string;
    smtp_from_name: string;
    // SES
    ses_region: string;
    ses_access_key: string;
    ses_secret_key: string;
    ses_from_email: string;
    // Fallback
    email: string;
    companyName: string;
}

async function loadEmailSettings(): Promise<CrmEmailSettings> {
    const result = await query('SELECT key, value FROM "crm_settings"');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
        settings[row.key] = row.value || '';
    }
    return settings as unknown as CrmEmailSettings;
}

async function sendViaSMTP(settings: CrmEmailSettings, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const port = parseInt(settings.smtp_port) || 587;
    const secure = settings.smtp_secure === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port,
        secure,
        auth: {
            user: settings.smtp_user,
            pass: settings.smtp_pass,
        },
    });

    const fromName = settings.smtp_from_name || settings.companyName || 'Open-Akquise';
    const fromEmail = settings.smtp_from_email || settings.email || settings.smtp_user;

    const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        })),
    });

    return { success: true, messageId: info.messageId };
}

async function sendViaSES(settings: CrmEmailSettings, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const client = new SESClient({
        region: settings.ses_region || 'eu-central-1',
        credentials: {
            accessKeyId: settings.ses_access_key,
            secretAccessKey: settings.ses_secret_key,
        },
    });

    const fromEmail = settings.ses_from_email || settings.email;
    const fromName = settings.companyName || 'Open-Akquise';

    // SES Einfache E-Mail (ohne Attachments via SES SDK)
    // Für Attachments über SES müsste man SendRawEmailCommand verwenden
    const command = new SendEmailCommand({
        Source: `${fromName} <${fromEmail}>`,
        Destination: {
            ToAddresses: [options.to],
        },
        Message: {
            Subject: { Data: options.subject, Charset: 'UTF-8' },
            Body: {
                Html: { Data: options.html, Charset: 'UTF-8' },
                ...(options.text ? { Text: { Data: options.text, Charset: 'UTF-8' } } : {}),
            },
        },
    });

    const result = await client.send(command);
    return { success: true, messageId: result.MessageId };
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
    try {
        const settings = await loadEmailSettings();
        const provider = settings.email_provider || 'none';

        if (provider === 'smtp') {
            if (!settings.smtp_host || !settings.smtp_user) {
                return { success: false, error: 'SMTP nicht vollstaendig konfiguriert (Host/User fehlt)', provider };
            }
            const result = await sendViaSMTP(settings, options);
            return { ...result, provider: 'smtp' };
        }

        if (provider === 'ses') {
            if (!settings.ses_access_key || !settings.ses_secret_key || !settings.ses_from_email) {
                return { success: false, error: 'AWS SES nicht vollstaendig konfiguriert', provider };
            }
            const result = await sendViaSES(settings, options);
            return { ...result, provider: 'ses' };
        }

        return { success: false, error: 'Kein E-Mail-Provider konfiguriert. Bitte unter CRM > Stammdaten SMTP oder SES einrichten.', provider: 'none' };
    } catch (error: any) {
        console.error('E-Mail Versand fehlgeschlagen:', error);
        return { success: false, error: error.message };
    }
}
