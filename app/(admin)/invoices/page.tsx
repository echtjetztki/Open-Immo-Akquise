'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    PlusCircle, Save, Search, Trash2, Download, Send,
    FileText, Mail, X, CheckCircle, AlertTriangle, Ban,
    Gavel, Landmark, CreditCard, RefreshCw, FileCheck,
    Truck, Receipt
} from 'lucide-react';

interface Article {
    id: number; title: string; description: string | null; price: number; unit: string;
}
interface Customer {
    id: number; name: string; email: string | null; address: string | null; company: string | null;
}
interface InvoiceItem {
    article_id: number | null; title: string; description: string | null;
    quantity: number; unit_price: number; total_price: number;
}
interface Invoice {
    id: number; invoice_number: string; customer_name: string; customer_email: string | null;
    customer_address: string | null; total_amount: number; status: string; issue_date: string;
    due_date: string | null; doc_type: string | null; notes: string | null; created_at: string;
}

const DOC_TYPES = ['Rechnung', 'Angebot', 'Lieferschein'];
const ALL_STATUSES = ['Entwurf', 'Gesendet', 'Bezahlt', 'Storniert', 'Klage', 'Inkasso'];

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDocType, setFilterDocType] = useState('');
    const [emailModal, setEmailModal] = useState<Invoice | null>(null);
    const [emailSending, setEmailSending] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [paymentProvider, setPaymentProvider] = useState<'none' | 'stripe' | 'paypal'>('none');
    const [actionMsg, setActionMsg] = useState('');

    const [settings, setSettings] = useState({
        companyName: 'Open CRM', ownerName: '', address: '', city: '',
        phone: '', email: '', iban: '', bic: '', taxId: '',
        paymentMethods: 'vorkasse', // vorkasse,stripe,paypal (comma-separated)
        agbText: '', datenschutzText: '', widerrufText: '',
        zahlungsziel: '14',
        bankName: '',
    });

    const [newInvoice, setNewInvoice] = useState({
        customer_name: '', customer_email: '', customer_address: '',
        status: 'Entwurf', doc_type: 'Rechnung', items: [] as InvoiceItem[]
    });

    const [selectedArticleId, setSelectedArticleId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, artRes, custRes] = await Promise.all([
                fetch('/api/crm/invoices'), fetch('/api/crm/articles'), fetch('/api/crm/customers')
            ]);
            if (invRes.ok) setInvoices(await invRes.json());
            if (artRes.ok) setArticles(await artRes.json());
            if (custRes.ok) setCustomers(await custRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        // Load from localStorage first (quick), then from DB (authoritative)
        const saved = localStorage.getItem('crmSettings');
        if (saved) { try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch { } }
        // Also load from DB settings
        fetch('/api/crm/settings').then(r => r.ok ? r.json() : {}).then((data: Record<string, string>) => {
            if (data && typeof data === 'object') {
                setSettings(prev => ({
                    ...prev,
                    companyName: data.company_name || prev.companyName,
                    ownerName: data.owner_name || prev.ownerName,
                    address: data.address || prev.address,
                    city: data.city || prev.city,
                    phone: data.phone || prev.phone,
                    email: data.email || prev.email,
                    iban: data.iban || prev.iban,
                    bic: data.bic || prev.bic,
                    taxId: data.tax_id || prev.taxId,
                    paymentMethods: data.payment_methods || prev.paymentMethods,
                    agbText: data.agb_text || prev.agbText,
                    datenschutzText: data.datenschutz_text || prev.datenschutzText,
                    widerrufText: data.widerruf_text || prev.widerrufText,
                    zahlungsziel: data.zahlungsziel || prev.zahlungsziel,
                    bankName: data.bank_name || prev.bankName,
                }));
            }
        }).catch(() => {});
    }, []);

    const handleSelectCustomer = (customerId: string) => {
        setSelectedCustomerId(customerId);
        const customer = customers.find(c => c.id.toString() === customerId);
        if (customer) {
            setNewInvoice(prev => ({
                ...prev,
                customer_name: customer.name,
                customer_email: customer.email || '',
                customer_address: customer.address || ''
            }));
        }
    };

    const handleAddItem = () => {
        const article = articles.find(a => a.id.toString() === selectedArticleId);
        if (article) {
            const unitPrice = parseFloat(String(article.price));
            setNewInvoice(prev => ({
                ...prev,
                items: [...prev.items, {
                    article_id: article.id, title: article.title, description: article.description,
                    quantity: selectedQuantity, unit_price: unitPrice, total_price: unitPrice * selectedQuantity
                }]
            }));
            setSelectedArticleId('');
            setSelectedQuantity(1);
        }
    };

    const handleRemoveItem = (index: number) => {
        setNewInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const invoiceTotal = newInvoice.items.reduce((sum, item) => sum + item.total_price, 0);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const prefix = newInvoice.doc_type === 'Angebot' ? 'AN' : newInvoice.doc_type === 'Lieferschein' ? 'LS' : 'RE';
            const res = await fetch('/api/crm/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newInvoice,
                    total_amount: invoiceTotal,
                    invoice_number: `${prefix}-${Date.now()}`
                })
            });
            if (res.ok) {
                setNewInvoice({ customer_name: '', customer_email: '', customer_address: '', status: 'Entwurf', doc_type: 'Rechnung', items: [] });
                setSelectedCustomerId('');
                setShowForm(false);
                fetchData();
            }
        } catch (e) { console.error(e); }
    };

    const handleStatusChange = async (invoiceId: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/crm/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setInvoices(prev => prev.map(inv =>
                    inv.id === invoiceId ? { ...inv, status: newStatus } : inv
                ));
                showActionMsg(`Status auf "${newStatus}" geaendert`);
            }
        } catch (e) { console.error(e); }
    };

    const handleConvertDoc = async (invoice: Invoice, newDocType: string) => {
        const prefix = newDocType === 'Angebot' ? 'AN' : newDocType === 'Lieferschein' ? 'LS' : 'RE';
        const newNumber = `${prefix}-${Date.now()}`;
        try {
            // Create a new document based on the existing one
            const res = await fetch('/api/crm/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: invoice.customer_name,
                    customer_email: invoice.customer_email,
                    customer_address: invoice.customer_address,
                    total_amount: invoice.total_amount,
                    status: 'Entwurf',
                    doc_type: newDocType,
                    invoice_number: newNumber,
                    items: []
                })
            });
            if (res.ok) {
                showActionMsg(`${newDocType} erstellt aus ${invoice.invoice_number}`);
                fetchData();
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Dokument wirklich loeschen?')) return;
        try {
            const res = await fetch(`/api/crm/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setInvoices(prev => prev.filter(inv => inv.id !== id));
                showActionMsg('Dokument geloescht');
            }
        } catch (e) { console.error(e); }
    };

    const handleSendEmail = async (invoice: Invoice) => {
        setEmailSending(true);
        try {
            let paymentLink = '';
            if (paymentProvider !== 'none') {
                const payRes = await fetch('/api/crm/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceId: invoice.id,
                        provider: paymentProvider,
                        baseUrl: window.location.origin
                    })
                });
                const payData = await payRes.json();
                if (payRes.ok && payData.paymentLink) {
                    paymentLink = payData.paymentLink;
                } else if (!payRes.ok) {
                    showActionMsg(`Zahlungslink-Fehler: ${payData.error}`);
                    setEmailSending(false);
                    return;
                }
            }

            const res = await fetch('/api/crm/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    to: invoice.customer_email,
                    subject: emailSubject || `${invoice.doc_type || 'Rechnung'} ${invoice.invoice_number}`,
                    message: emailMessage,
                    paymentLink
                })
            });
            const data = await res.json();
            if (res.ok) {
                showActionMsg(data.message || 'E-Mail gesendet!');
                setEmailModal(null);
                setEmailMessage('');
                setEmailSubject('');
                setPaymentProvider('none');
                fetchData();
            } else {
                showActionMsg(`Fehler: ${data.error}`);
            }
        } catch (e) {
            showActionMsg('E-Mail-Versand fehlgeschlagen');
        } finally {
            setEmailSending(false);
        }
    };

    const showActionMsg = (msg: string) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 4000);
    };

    // Generate EPC QR Code data string for SEPA bank transfer
    const generateEpcQrData = (invoice: Invoice) => {
        const amount = Number(invoice.total_amount).toFixed(2);
        // EPC069-12 standard for SEPA Credit Transfer QR
        return [
            'BCD',           // Service Tag
            '002',           // Version
            '1',             // Encoding (UTF-8)
            'SCT',           // Identification
            settings.bic || '',  // BIC
            settings.ownerName || settings.companyName || '', // Beneficiary Name
            settings.iban || '',  // IBAN
            `EUR${amount}`,  // Amount
            '',              // Purpose
            invoice.invoice_number, // Reference
            `${invoice.doc_type || 'Rechnung'} ${invoice.invoice_number}`, // Text
            ''               // Info
        ].join('\n');
    };

    const generatePDFBlob = async (invoice: Invoice) => {
        const doc = new jsPDF();
        const docType = invoice.doc_type || 'Rechnung';
        const amount = Number(invoice.total_amount);
        const amountStr = amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const issueDate = new Date(invoice.issue_date).toLocaleDateString('de-DE');
        const dueDays = parseInt(settings.zahlungsziel || '14');
        const dueDate = new Date(new Date(invoice.issue_date).getTime() + dueDays * 86400000).toLocaleDateString('de-DE');
        const methods = (settings.paymentMethods || 'vorkasse').split(',').map(m => m.trim());

        // ─── Header: Company info (right side) ───
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.companyName || 'Ihr Unternehmen', 130, 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        let ry = 24;
        if (settings.ownerName) { doc.text(settings.ownerName, 130, ry); ry += 5; }
        if (settings.address) { doc.text(settings.address, 130, ry); ry += 5; }
        if (settings.city) { doc.text(settings.city, 130, ry); ry += 5; }
        if (settings.phone) { doc.text(`Tel: ${settings.phone}`, 130, ry); ry += 5; }
        if (settings.email) { doc.text(settings.email, 130, ry); ry += 5; }
        if (settings.taxId) { doc.text(`USt-IdNr: ${settings.taxId}`, 130, ry); ry += 5; }

        // ─── Receiver (left side) ───
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`${settings.companyName || ''} | ${settings.address || ''} | ${settings.city || ''}`, 14, 42);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.customer_name || 'Unbekannt', 14, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        let cy = 56;
        if (invoice.customer_address) { doc.text(invoice.customer_address, 14, cy); cy += 5; }
        if (invoice.customer_email) { doc.text(invoice.customer_email, 14, cy); cy += 5; }

        // ─── Document title ───
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 124);
        doc.text(docType.toUpperCase(), 14, 78);
        doc.setTextColor(0, 0, 0);

        // ─── Meta info ───
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const docLabel = docType === 'Rechnung' ? 'Rechnungsnr.' : docType === 'Angebot' ? 'Angebotsnr.' : 'Lieferscheinnr.';
        doc.text(`${docLabel}:`, 130, 74);
        doc.text(invoice.invoice_number, 165, 74);
        doc.text('Datum:', 130, 80);
        doc.text(issueDate, 165, 80);
        if (docType === 'Rechnung') {
            doc.text('Faellig bis:', 130, 86);
            doc.text(dueDate, 165, 86);
        }

        // ─── Intro text ───
        doc.setFontSize(10);
        let introY = 96;
        if (docType === 'Rechnung') {
            doc.text('Sehr geehrte Damen und Herren,', 14, introY);
            doc.text('wir erlauben uns, Ihnen folgende Positionen in Rechnung zu stellen:', 14, introY + 6);
            introY += 14;
        } else if (docType === 'Angebot') {
            doc.text('Sehr geehrte Damen und Herren,', 14, introY);
            doc.text('gerne unterbreiten wir Ihnen folgendes Angebot:', 14, introY + 6);
            introY += 14;
        } else {
            doc.text('Lieferung an oben genannte Adresse:', 14, introY);
            introY += 8;
        }

        // ─── Items table ───
        (doc as any).autoTable({
            startY: introY,
            head: [['Pos.', 'Beschreibung', 'Menge', 'Einzelpreis', 'Gesamt']],
            body: [['1', 'Leistung / Produkt', '1', `${amountStr} EUR`, `${amountStr} EUR`]],
            theme: 'striped',
            headStyles: { fillColor: [0, 74, 124], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 80 } },
        });

        let y = (doc as any).lastAutoTable.finalY + 5;

        // ─── Net / Tax / Total ───
        const netAmount = (amount / 1.19);
        const taxAmount = amount - netAmount;
        doc.setFontSize(9);
        doc.text('Nettobetrag:', 130, y); doc.text(`${netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR`, 175, y, { align: 'right' }); y += 5;
        doc.text('zzgl. 19% MwSt:', 130, y); doc.text(`${taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR`, 175, y, { align: 'right' }); y += 6;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 124);
        doc.text('Gesamtbetrag:', 130, y); doc.text(`${amountStr} EUR`, 175, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        y += 12;

        // ─── Payment methods section (only for Rechnung) ───
        if (docType === 'Rechnung') {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Zahlungsarten:', 14, y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            y += 7;

            if (methods.includes('vorkasse') && settings.iban) {
                doc.setFont('helvetica', 'bold');
                doc.text('Vorkasse / Bankueberweisung:', 14, y);
                doc.setFont('helvetica', 'normal');
                y += 5;
                doc.text(`Empfaenger: ${settings.ownerName || settings.companyName || ''}`, 14, y); y += 4;
                if (settings.bankName) { doc.text(`Bank: ${settings.bankName}`, 14, y); y += 4; }
                doc.text(`IBAN: ${settings.iban}`, 14, y); y += 4;
                if (settings.bic) { doc.text(`BIC: ${settings.bic}`, 14, y); y += 4; }
                doc.text(`Verwendungszweck: ${invoice.invoice_number}`, 14, y); y += 4;
                doc.text(`Zahlungsziel: ${dueDays} Tage (bis ${dueDate})`, 14, y); y += 6;

                // QR Code for bank transfer (EPC)
                try {
                    const QRCode = (await import('qrcode')).default;
                    const qrData = generateEpcQrData(invoice);
                    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1, errorCorrectionLevel: 'M' });
                    doc.addImage(qrDataUrl, 'PNG', 155, y - 28, 30, 30);
                    doc.setFontSize(7);
                    doc.text('QR-Code scannen', 157, y + 4);
                    doc.text('zum Bezahlen', 159, y + 7);
                    doc.setFontSize(9);
                } catch { /* QR generation failed silently */ }
                y += 4;
            }

            if (methods.includes('stripe')) {
                doc.setFont('helvetica', 'bold');
                doc.text('Online-Zahlung (Kreditkarte / SEPA):', 14, y);
                doc.setFont('helvetica', 'normal');
                y += 5;
                doc.text('Bezahlen Sie bequem online ueber den Zahlungslink in der E-Mail.', 14, y);
                y += 8;
            }

            if (methods.includes('paypal')) {
                doc.setFont('helvetica', 'bold');
                doc.text('PayPal:', 14, y);
                doc.setFont('helvetica', 'normal');
                y += 5;
                doc.text('Bezahlen Sie per PayPal ueber den Zahlungslink in der E-Mail.', 14, y);
                y += 8;
            }
        }

        // ─── Closing text ───
        if (docType === 'Rechnung') {
            y += 4;
            doc.setFontSize(9);
            doc.text('Bitte ueberweisen Sie den Gesamtbetrag unter Angabe der Rechnungsnummer.', 14, y); y += 5;
            doc.text('Vielen Dank fuer Ihr Vertrauen!', 14, y); y += 10;
        } else if (docType === 'Angebot') {
            y += 4;
            doc.setFontSize(9);
            doc.text('Dieses Angebot ist 30 Tage gueltig. Bei Fragen stehen wir Ihnen gerne zur Verfuegung.', 14, y); y += 5;
            doc.text('Wir freuen uns auf Ihre Rueckmeldung!', 14, y); y += 10;
        }

        doc.text('Mit freundlichen Gruessen', 14, y); y += 5;
        doc.text(settings.ownerName || settings.companyName || '', 14, y); y += 10;

        // ─── Legal texts (AGB, Datenschutz, Widerruf) ───
        if (docType === 'Rechnung') {
            const legalTexts: { title: string; text: string }[] = [];
            if (settings.agbText) legalTexts.push({ title: 'Allgemeine Geschaeftsbedingungen', text: settings.agbText });
            if (settings.datenschutzText) legalTexts.push({ title: 'Datenschutzhinweis', text: settings.datenschutzText });
            if (settings.widerrufText) legalTexts.push({ title: 'Widerrufsbelehrung', text: settings.widerrufText });

            if (legalTexts.length > 0) {
                // Check if we need a new page
                if (y > 240) { doc.addPage(); y = 20; }

                doc.setDrawColor(200, 200, 200);
                doc.line(14, y, 196, y); y += 8;

                for (const legal of legalTexts) {
                    if (y > 260) { doc.addPage(); y = 20; }
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(legal.title, 14, y); y += 5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    const lines = doc.splitTextToSize(legal.text, 182);
                    for (const line of lines) {
                        if (y > 280) { doc.addPage(); y = 20; }
                        doc.text(line, 14, y); y += 3.5;
                    }
                    y += 5;
                }
            }
        }

        // ─── Footer line ───
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(0, 74, 124);
        doc.setLineWidth(0.5);
        doc.line(14, pageH - 18, 196, pageH - 18);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        const footerParts = [settings.companyName, settings.address, settings.city, settings.phone, settings.email].filter(Boolean);
        doc.text(footerParts.join(' | '), 14, pageH - 13);
        if (settings.iban) {
            doc.text(`IBAN: ${settings.iban}${settings.bic ? ' | BIC: ' + settings.bic : ''}${settings.taxId ? ' | USt-IdNr: ' + settings.taxId : ''}`, 14, pageH - 9);
        }
        doc.setTextColor(0, 0, 0);

        return doc.output('blob');
    };

    const handleDownloadPDF = async (invoice: Invoice) => {
        const blob = await generatePDFBlob(invoice);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const prefix = invoice.doc_type === 'Angebot' ? 'Angebot' : invoice.doc_type === 'Lieferschein' ? 'Lieferschein' : 'Rechnung';
        link.download = `${prefix}_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fmt = (n: number) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2 });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Bezahlt': return 'bg-green-100 text-green-700 border-green-300';
            case 'Gesendet': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Entwurf': return 'bg-stone-100 text-stone-700 border-stone-300';
            case 'Storniert': return 'bg-gray-100 text-gray-500 border-gray-300';
            case 'Klage': return 'bg-red-100 text-red-700 border-red-300';
            case 'Inkasso': return 'bg-orange-100 text-orange-700 border-orange-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Bezahlt': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'Klage': return <Gavel className="w-3.5 h-3.5" />;
            case 'Inkasso': return <Landmark className="w-3.5 h-3.5" />;
            case 'Storniert': return <Ban className="w-3.5 h-3.5" />;
            case 'Gesendet': return <Send className="w-3.5 h-3.5" />;
            default: return <FileText className="w-3.5 h-3.5" />;
        }
    };

    const getDocTypeIcon = (docType: string | null) => {
        switch (docType) {
            case 'Angebot': return <FileCheck className="w-4 h-4 text-purple-500" />;
            case 'Lieferschein': return <Truck className="w-4 h-4 text-teal-500" />;
            default: return <Receipt className="w-4 h-4 text-blue-500" />;
        }
    };

    const getDocTypeBorder = (docType: string | null) => {
        switch (docType) {
            case 'Angebot': return 'border-t-purple-500';
            case 'Lieferschein': return 'border-t-teal-500';
            default: return 'border-t-secondary';
        }
    };

    const filtered = invoices.filter(inv => {
        const s = search.toLowerCase();
        const matchSearch = !s || inv.customer_name.toLowerCase().includes(s) || inv.invoice_number.toLowerCase().includes(s);
        const matchStatus = !filterStatus || inv.status === filterStatus;
        const matchDocType = !filterDocType || (inv.doc_type || 'Rechnung') === filterDocType;
        return matchSearch && matchStatus && matchDocType;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            {/* Action message toast */}
            {actionMsg && (
                <div className="fixed top-4 right-4 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-medium">
                    {actionMsg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Dokumente
                    </h1>
                    <p className="text-muted-foreground mt-1">Rechnungen, Angebote & Lieferscheine</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Neues Dokument
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex items-center gap-3 glass-card p-3 flex-1">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm py-1" />
                </div>
                <select value={filterDocType} onChange={e => setFilterDocType(e.target.value)}
                    className="py-2.5 px-3 text-sm rounded-xl border border-primary/20 bg-background">
                    <option value="">Alle Typen</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="py-2.5 px-3 text-sm rounded-xl border border-primary/20 bg-background">
                    <option value="">Alle Status</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Invoice Form */}
            {showForm && (
                <div className="glass-card p-6 border-l-4 border-l-secondary space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-secondary">Neues Dokument erstellen</h3>
                        <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateInvoice} className="space-y-6">
                        {/* Doc type selection */}
                        <div className="flex gap-2">
                            {DOC_TYPES.map(dt => (
                                <button key={dt} type="button"
                                    onClick={() => setNewInvoice(prev => ({ ...prev, doc_type: dt }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${newInvoice.doc_type === dt
                                        ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                    {getDocTypeIcon(dt)} {dt}
                                </button>
                            ))}
                        </div>

                        {/* Customer selection */}
                        {customers.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium mb-1">Kunde aus Stammdaten</label>
                                <select value={selectedCustomerId} onChange={e => handleSelectCustomer(e.target.value)}
                                    className="w-full py-2 text-sm bg-white">
                                    <option value="">-- Manuell eingeben --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Name *</label>
                                <input type="text" required value={newInvoice.customer_name}
                                    onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                                    className="w-full py-2 text-sm" placeholder="Max Mustermann" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">E-Mail</label>
                                <input type="email" value={newInvoice.customer_email}
                                    onChange={e => setNewInvoice({ ...newInvoice, customer_email: e.target.value })}
                                    className="w-full py-2 text-sm" placeholder="max@beispiel.de" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Adresse</label>
                                <input type="text" value={newInvoice.customer_address}
                                    onChange={e => setNewInvoice({ ...newInvoice, customer_address: e.target.value })}
                                    className="w-full py-2 text-sm" placeholder="Strasse 1, PLZ Ort" />
                            </div>
                        </div>

                        {/* Line items */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <h4 className="text-sm font-semibold mb-3">Positionen</h4>
                            <div className="flex items-end gap-3 flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-medium mb-1">Artikel</label>
                                    <select value={selectedArticleId} onChange={e => setSelectedArticleId(e.target.value)}
                                        className="w-full py-2 text-sm bg-white">
                                        <option value="">-- Bitte waehlen --</option>
                                        {articles.map(a => (
                                            <option key={a.id} value={a.id}>{a.title} ({fmt(a.price)} EUR)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium mb-1">Menge</label>
                                    <input type="number" min="1" value={selectedQuantity}
                                        onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full py-2 text-sm" />
                                </div>
                                <button type="button" onClick={handleAddItem} disabled={!selectedArticleId}
                                    className="btn-secondary py-2 h-[38px] flex items-center gap-2 px-4">
                                    <PlusCircle className="w-4 h-4" /> Hinzufuegen
                                </button>
                            </div>

                            {newInvoice.items.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-primary/10">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-muted-foreground border-b border-primary/10">
                                                <th className="pb-2">Position</th>
                                                <th className="pb-2 text-center">Menge</th>
                                                <th className="pb-2 text-right">Einzel</th>
                                                <th className="pb-2 text-right">Gesamt</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {newInvoice.items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-primary/5 last:border-0">
                                                    <td className="py-2.5 font-medium">{item.title}</td>
                                                    <td className="py-2.5 text-center">{item.quantity}</td>
                                                    <td className="py-2.5 text-right text-muted-foreground">{fmt(item.unit_price)} EUR</td>
                                                    <td className="py-2.5 text-right font-medium">{fmt(item.total_price)} EUR</td>
                                                    <td className="py-2.5 text-right">
                                                        <button type="button" onClick={() => handleRemoveItem(idx)}
                                                            className="text-error hover:bg-error/10 p-1.5 rounded-lg">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-primary/20">
                                                <td colSpan={3} className="py-3 text-right font-bold">Summe:</td>
                                                <td className="py-3 text-right font-bold text-primary text-base">{fmt(invoiceTotal)} EUR</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Abbrechen</button>
                            <button type="submit" disabled={newInvoice.items.length === 0} className="btn-primary flex items-center gap-2">
                                <Save className="w-4 h-4" /> {newInvoice.doc_type} Speichern
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Invoice Cards */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Dokumente...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground glass-card">
                            {search || filterStatus || filterDocType ? 'Keine Dokumente gefunden.' : 'Noch keine Dokumente erstellt.'}
                        </div>
                    ) : filtered.map(inv => (
                        <div key={inv.id} className={`glass-card hover:shadow-xl transition-all duration-300 flex flex-col h-full border-t-4 ${getDocTypeBorder(inv.doc_type)} relative overflow-hidden`}>
                            <div className="p-5 flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {getDocTypeIcon(inv.doc_type)}
                                        <div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{inv.invoice_number}</div>
                                            <h3 className="font-bold text-base text-foreground line-clamp-1">{inv.customer_name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1 ${getStatusColor(inv.status)}`}>
                                            {getStatusIcon(inv.status)} {inv.status}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{inv.doc_type || 'Rechnung'}</span>
                                    </div>
                                </div>

                                {inv.customer_email && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        <span className="line-clamp-1">{inv.customer_email}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <div className="text-xs font-medium text-muted-foreground">Betrag</div>
                                    <div className="font-bold text-lg text-primary">{fmt(inv.total_amount)} EUR</div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Datum: {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('de-DE') : '-'}</span>
                                    {(inv.doc_type || 'Rechnung') === 'Rechnung' && (
                                        <div className="flex gap-1">
                                            {settings.paymentMethods.includes('vorkasse') && (
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-medium">Vorkasse</span>
                                            )}
                                            {settings.paymentMethods.includes('stripe') && (
                                                <span className="px-1.5 py-0.5 bg-[#635bff]/10 text-[#635bff] rounded text-[9px] font-medium">Stripe</span>
                                            )}
                                            {settings.paymentMethods.includes('paypal') && (
                                                <span className="px-1.5 py-0.5 bg-[#0070ba]/10 text-[#0070ba] rounded text-[9px] font-medium">PayPal</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status Change */}
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-medium uppercase">Status aendern:</label>
                                    <select value={inv.status} onChange={e => handleStatusChange(inv.id, e.target.value)}
                                        className="w-full py-1.5 px-2 text-xs rounded-lg border border-primary/20 bg-background mt-1">
                                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 border-t border-primary/10 bg-background/50 space-y-2 mt-auto">
                                {/* Row 1: PDF & Email */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleDownloadPDF(inv)}
                                        className="btn-secondary flex items-center justify-center gap-1.5 py-1.5 text-xs">
                                        <Download className="w-3.5 h-3.5" /> PDF
                                    </button>
                                    <button onClick={() => {
                                        setEmailModal(inv);
                                        setEmailSubject(`${inv.doc_type || 'Rechnung'} ${inv.invoice_number}`);
                                    }}
                                        disabled={!inv.customer_email}
                                        className="btn-primary flex items-center justify-center gap-1.5 py-1.5 text-xs shadow-md">
                                        <Mail className="w-3.5 h-3.5" /> E-Mail
                                    </button>
                                </div>
                                {/* Row 2: Convert & Delete */}
                                <div className="grid grid-cols-3 gap-2">
                                    {DOC_TYPES.filter(dt => dt !== (inv.doc_type || 'Rechnung')).map(dt => (
                                        <button key={dt} onClick={() => handleConvertDoc(inv, dt)}
                                            className="btn-secondary flex items-center justify-center gap-1 py-1.5 text-[10px]">
                                            {getDocTypeIcon(dt)} {dt === 'Lieferschein' ? 'Liefers.' : dt}
                                        </button>
                                    ))}
                                    <button onClick={() => handleDelete(inv.id)}
                                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] text-error hover:bg-error/10 rounded-lg border border-error/20">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Email Modal */}
            {emailModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEmailModal(null)} />
                    <div className="relative z-10 w-full max-w-lg bg-background border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-primary/10">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary" />
                                {emailModal.doc_type || 'Rechnung'} per E-Mail senden
                            </h2>
                            <button onClick={() => setEmailModal(null)} className="p-1.5 rounded-lg hover:bg-primary/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">An:</span>
                                    <span className="font-medium">{emailModal.customer_email}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-muted-foreground">Betrag:</span>
                                    <span className="font-bold text-primary">{fmt(emailModal.total_amount)} EUR</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">Betreff</label>
                                <input type="text" value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                    className="w-full py-2 text-sm" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">Nachricht (optional)</label>
                                <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)}
                                    className="w-full py-2 text-sm min-h-[80px]"
                                    placeholder="Optionale persoenliche Nachricht..." />
                            </div>

                            {/* Payment Provider */}
                            <div>
                                <label className="block text-xs font-medium mb-2">Zahlungsbutton einfuegen</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPaymentProvider('none')}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${paymentProvider === 'none' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                        Keiner
                                    </button>
                                    <button type="button" onClick={() => setPaymentProvider('stripe')}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentProvider === 'stripe' ? 'bg-[#635bff] text-white' : 'bg-[#635bff]/10 text-[#635bff]'}`}>
                                        <CreditCard className="w-3.5 h-3.5" /> Stripe
                                    </button>
                                    <button type="button" onClick={() => setPaymentProvider('paypal')}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentProvider === 'paypal' ? 'bg-[#0070ba] text-white' : 'bg-[#0070ba]/10 text-[#0070ba]'}`}>
                                        <CreditCard className="w-3.5 h-3.5" /> PayPal
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setEmailModal(null)} className="btn-secondary">Abbrechen</button>
                                <button onClick={() => handleSendEmail(emailModal)}
                                    disabled={emailSending}
                                    className="btn-primary flex items-center gap-2">
                                    {emailSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {emailSending ? 'Sendet...' : 'Jetzt senden'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
