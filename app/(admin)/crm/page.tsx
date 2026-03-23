'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';
import {
    PlusCircle, Box, FileText, Download, Send, Save, User,
    Search, Trash2, Mail, CreditCard, Banknote,
    AlertTriangle, CheckCircle2, Clock, XCircle, FileSpreadsheet,
    Home, ExternalLink, Copy, RefreshCw, Link2
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    'Entwurf': { color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', icon: FileText },
    'Offen': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400', icon: Clock },
    'Bezahlt': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400', icon: CheckCircle2 },
    'Inkasso': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-400', icon: AlertTriangle },
    'Storniert': { color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle },
};

const DOC_TYPE_CONFIG: Record<string, { label: string; prefix: string; icon: any; color: string }> = {
    'Rechnung': { label: 'Rechnung', prefix: 'RE', icon: FileText, color: 'text-primary' },
    'Angebot': { label: 'Angebot', prefix: 'AG', icon: FileSpreadsheet, color: 'text-blue-600' },
    'Expose': { label: 'Exposé', prefix: 'EX', icon: Home, color: 'text-violet-600' },
};

export default function CRMDashboard() {
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const [activeTab, setActiveTab] = useState<'invoices' | 'articles' | 'paylink' | 'settings'>('invoices');

    // PayLink Generator State
    const [payLinkAmount, setPayLinkAmount] = useState('');
    const [payLinkDesc, setPayLinkDesc] = useState('');
    const [payLinkEmail, setPayLinkEmail] = useState('');
    const [payLinkCreating, setPayLinkCreating] = useState(false);
    const [payLinkHistory, setPayLinkHistory] = useState<Array<{url: string; amount: number; desc: string; created: string}>>([]);

    const handleCreateQuickPayLink = async () => {
        if (!payLinkAmount || parseFloat(payLinkAmount) <= 0) { alert('Bitte Betrag eingeben'); return; }
        setPayLinkCreating(true);
        try {
            const res = await fetch('/api/crm/stripe/quick-paylink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: payLinkAmount, description: payLinkDesc || 'Zahlung', customer_email: payLinkEmail || undefined })
            });
            const data = await res.json();
            if (data.success && data.payment_url) {
                await navigator.clipboard.writeText(data.payment_url);
                setPayLinkHistory(prev => [{ url: data.payment_url, amount: data.amount, desc: payLinkDesc || 'Zahlung', created: new Date().toLocaleString('de-DE') }, ...prev]);
                setPayLinkAmount(''); setPayLinkDesc(''); setPayLinkEmail('');
                alert('PayLink erstellt und in die Zwischenablage kopiert!');
            } else {
                alert('Fehler: ' + (data.error || 'Unbekannt'));
            }
        } catch { alert('Netzwerkfehler'); } finally { setPayLinkCreating(false); }
    };
    const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [settings, setSettings] = useState({
        companyName: 'Open-Akquise',
        ownerName: '',
        address: 'Musterstraße 1',
        city: '1010 Wien',
        phone: '',
        email: '',
        iban: '',
        bic: '',
        stripe_publishable_key: '',
        stripe_secret_key: '',
        email_provider: 'none',
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        smtp_secure: 'false',
        smtp_from_email: '',
        smtp_from_name: '',
        ses_region: 'eu-central-1',
        ses_access_key: '',
        ses_secret_key: '',
        ses_from_email: '',
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<number | null>(null);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch('/api/crm/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Einstellungen gespeichert!');
            else alert('Fehler beim Speichern');
        } catch { alert('Netzwerkfehler'); } finally { setSavingSettings(false); }
    };

    const [articles, setArticles] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newArticle, setNewArticle] = useState({ title: '', description: '', price: 0, unit: 'Stück' });
    const [showArticleForm, setShowArticleForm] = useState(false);

    const [newInvoice, setNewInvoice] = useState({
        customer_name: '',
        customer_email: '',
        customer_address: '',
        doc_type: 'Rechnung',
        status: 'Entwurf',
        payment_method: '',
        notes: '',
        due_date: '',
        items: [] as any[]
    });
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    const [selectedArticleId, setSelectedArticleId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    const handleSendEmail = async (invoiceId: number) => {
        setSendingEmail(invoiceId);
        try {
            const res = await fetch('/api/crm/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_id: invoiceId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`E-Mail gesendet via ${data.provider}!`);
                fetchData();
            } else {
                alert(`E-Mail Fehler: ${data.error}`);
            }
        } catch { alert('Netzwerkfehler beim E-Mail-Versand'); }
        finally { setSendingEmail(null); }
    };

    // Stripe Payment Link Zustand
    const [creatingPaymentLink, setCreatingPaymentLink] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [artRes, invRes] = await Promise.all([
                fetch('/api/crm/articles'),
                fetch('/api/crm/invoices')
            ]);
            if (artRes.ok) setArticles(await artRes.json());
            if (invRes.ok) setInvoices(await invRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Settings aus DB laden
        fetch('/api/crm/settings').then(r => r.json()).then(data => {
            if (data && !data.error) setSettings(prev => ({ ...prev, ...data }));
        }).catch(() => {});
    }, []);

    const handleCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArticle)
            });
            if (res.ok) {
                setNewArticle({ title: '', description: '', price: 0, unit: 'Stück' });
                setShowArticleForm(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to create article', error);
        }
    };

    const handleAddInvoiceItem = () => {
        const article = articles.find(a => a.id.toString() === selectedArticleId);
        if (article) {
            const unitPrice = parseFloat(article.price);
            const qty = selectedQuantity;
            const newItem = {
                article_id: article.id,
                title: article.title,
                description: article.description,
                quantity: qty,
                unit_price: unitPrice,
                total_price: unitPrice * qty
            };
            setNewInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
            setSelectedArticleId('');
            setSelectedQuantity(1);
        }
    };

    const handleRemoveInvoiceItem = (index: number) => {
        const newItems = [...newInvoice.items];
        newItems.splice(index, 1);
        setNewInvoice(prev => ({ ...prev, items: newItems }));
    };

    const invoiceTotal = newInvoice.items.reduce((sum, item) => sum + item.total_price, 0);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newInvoice,
                    total_amount: invoiceTotal
                })
            });
            if (res.ok) {
                setNewInvoice({
                    customer_name: '', customer_email: '', customer_address: '',
                    doc_type: 'Rechnung', status: 'Entwurf', payment_method: '', notes: '', due_date: '',
                    items: []
                });
                setShowInvoiceForm(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to create invoice', error);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const patchBody: any = { status: newStatus };
            if (newStatus === 'Bezahlt') {
                patchBody.paid_at = new Date().toISOString();
            }
            const res = await fetch(`/api/crm/invoices/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patchBody)
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Status update failed', error);
        }
    };

    const handleDeleteInvoice = async (id: number) => {
        if (!confirm('Dokument wirklich loeschen?')) return;
        try {
            const res = await fetch(`/api/crm/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleCreateStripeLink = async (invoiceId: number) => {
        setCreatingPaymentLink(invoiceId);
        try {
            const res = await fetch('/api/crm/stripe/create-payment-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_id: invoiceId })
            });
            const data = await res.json();
            if (res.ok && data.payment_url) {
                // Link kopieren
                await navigator.clipboard.writeText(data.payment_url);
                alert(`Stripe Payment Link erstellt und kopiert!\n\n${data.payment_url}`);
                fetchData();
            } else {
                alert(`Fehler: ${data.error || 'Unbekannter Fehler'}`);
            }
        } catch (error) {
            console.error('Stripe link error', error);
            alert('Stripe Payment Link konnte nicht erstellt werden.');
        } finally {
            setCreatingPaymentLink(null);
        }
    };

    const handleSetVorkasse = async (id: number) => {
        try {
            const res = await fetch(`/api/crm/invoices/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_method: 'vorkasse', status: 'Offen' })
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Vorkasse update failed', error);
        }
    };

    const generatePDFBlob = (invoice: any) => {
        const doc = new jsPDF();
        const docTypeLabel = DOC_TYPE_CONFIG[invoice.doc_type]?.label || invoice.doc_type || 'Rechnung';

        doc.setFontSize(22);
        doc.text(docTypeLabel.toUpperCase(), 14, 20);

        doc.setFontSize(10);
        doc.text(`Nr: ${invoice.invoice_number}`, 14, 30);
        doc.text(`Datum: ${new Date(invoice.issue_date).toLocaleDateString('de-DE')}`, 14, 36);
        if (invoice.due_date) {
            doc.text(`Faellig: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`, 14, 42);
        }

        doc.setFontSize(12);
        doc.text(settings.companyName || 'Ihr Unternehmen', 130, 20);
        doc.setFontSize(10);
        doc.text(settings.address || '', 130, 26);
        doc.text(settings.city || '', 130, 32);
        if (settings.phone) doc.text(settings.phone, 130, 38);
        if (settings.email) doc.text(settings.email, 130, 44);

        doc.setFontSize(12);
        doc.text('Empfaenger:', 14, 54);
        doc.setFontSize(10);
        doc.text(invoice.customer_name || 'Unbekannt', 14, 60);
        if (invoice.customer_address) doc.text(invoice.customer_address, 14, 66);
        if (invoice.customer_email) doc.text(invoice.customer_email, 14, 72);

        const startY = 85;
        (doc as any).autoTable({
            startY,
            head: [['Position', 'Menge', 'Einzelpreis', 'Gesamt']],
            body: [
                ['Gesamtposition', '1', `${invoice.total_amount} EUR`, `${invoice.total_amount} EUR`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [45, 212, 191] }
        });

        const finalY = (doc as any).lastAutoTable.finalY || startY + 20;
        doc.setFontSize(14);
        doc.text(`Gesamtbetrag: ${Number(invoice.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`, 14, finalY + 15);

        // Zahlungsinformationen
        const payY = finalY + 30;
        doc.setFontSize(10);
        if (invoice.payment_method === 'stripe' && invoice.stripe_payment_link) {
            doc.text('Zahlung via Stripe: ' + invoice.stripe_payment_link, 14, payY);
        } else if (settings.iban) {
            doc.text(`Bankverbindung: IBAN: ${settings.iban} ${settings.bic ? '| BIC: ' + settings.bic : ''}`, 14, payY);
            doc.text('Bitte den Rechnungsbetrag per Überweisung an obige Bankverbindung überweisen.', 14, payY + 6);
        }

        if (invoice.notes) {
            doc.text(`Anmerkung: ${invoice.notes}`, 14, payY + 18);
        }

        return doc.output('blob');
    };

    const handleDownloadPDF = (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const prefix = DOC_TYPE_CONFIG[invoice.doc_type]?.label || 'Dokument';
        link.download = `${prefix}_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const prefix = DOC_TYPE_CONFIG[invoice.doc_type]?.label || 'Dokument';
        const file = new File([blob], `${prefix}_${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `${prefix} ${invoice.invoice_number}`,
                    text: `Hallo, anbei ${prefix} ${invoice.invoice_number}.`
                });
            } catch { }
        } else {
            handleDownloadPDF(invoice);
        }
    };

    // Gefilterte Rechnungen
    const filteredInvoices = invoices.filter(inv => {
        if (docTypeFilter !== 'all' && inv.doc_type !== docTypeFilter) return false;
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (inv.customer_name || '').toLowerCase().includes(q)
                || (inv.invoice_number || '').toLowerCase().includes(q)
                || (inv.customer_email || '').toLowerCase().includes(q);
        }
        return true;
    });

    // Zusammenfassung
    const totalOffen = invoices.filter(i => i.status === 'Offen').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
    const totalBezahlt = invoices.filter(i => i.status === 'Bezahlt').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
    const totalInkasso = invoices.filter(i => i.status === 'Inkasso').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    CRM & Finanzen
                </h1>
                <p className="text-muted-foreground mt-2">
                    Angebote, Exposes und Rechnungen verwalten – mit Stripe & Vorkasse.
                </p>
            </div>

            {isReadOnlyDemo && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                    Demo-Modus: Keine Änderungen möglich.
                </div>
            )}

            {/* KPI Karten */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 border-l-4 border-l-orange-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Offene Summe</div>
                    <div className="text-xl font-bold text-orange-600">{totalOffen.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Offen').length} Dokumente</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-emerald-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Bezahlt</div>
                    <div className="text-xl font-bold text-emerald-600">{totalBezahlt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Bezahlt').length} Dokumente</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-red-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Inkasso</div>
                    <div className="text-xl font-bold text-red-600">{totalInkasso.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Inkasso').length} Dokumente</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-primary">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Gesamt</div>
                    <div className="text-xl font-bold text-primary">{invoices.length}</div>
                    <div className="text-xs text-muted-foreground">Dokumente insgesamt</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-primary/20 overflow-x-auto">
                <button onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <FileText className="w-5 h-5" /> Dokumente
                </button>
                <button onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'articles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Box className="w-5 h-5" /> Artikel
                </button>
                <button onClick={() => setActiveTab('paylink')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'paylink' ? 'border-violet-600 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Link2 className="w-5 h-5" /> PayLink
                </button>
                <button onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <User className="w-5 h-5" /> Stammdaten & Stripe
                </button>
            </div>

            {/* =========== PAYLINK GENERATOR =========== */}
            {activeTab === 'paylink' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-violet-600" /> Stripe PayLink Generator
                    </h2>

                    <div className="glass-card p-6 border-l-4 border-l-violet-500">
                        <p className="text-sm text-muted-foreground mb-6">
                            Erstelle einen einmaligen Stripe-Zahlungslink. Gib einfach den Betrag ein und teile den Link mit deinem Kunden.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label htmlFor="plAmount" className="block text-xs font-medium mb-1">Betrag (EUR) <span className="text-red-500">*</span></label>
                                <input id="plAmount" type="number" step="0.01" min="0.50" placeholder="z.B. 250.00" value={payLinkAmount} onChange={e => setPayLinkAmount(e.target.value)}
                                    className="input-field py-3 text-lg font-bold w-full" />
                            </div>
                            <div>
                                <label htmlFor="plDesc" className="block text-xs font-medium mb-1">Beschreibung</label>
                                <input id="plDesc" type="text" placeholder="z.B. Beratungsgebuehr" value={payLinkDesc} onChange={e => setPayLinkDesc(e.target.value)}
                                    className="input-field py-3 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="plEmail" className="block text-xs font-medium mb-1">Kunden-E-Mail (optional)</label>
                                <input id="plEmail" type="email" placeholder="kunde@email.com" value={payLinkEmail} onChange={e => setPayLinkEmail(e.target.value)}
                                    className="input-field py-3 text-sm w-full" />
                            </div>
                            <div>
                                <button onClick={handleCreateQuickPayLink} disabled={payLinkCreating || !payLinkAmount}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm hover:from-violet-600 hover:to-violet-700 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {payLinkCreating ? 'Erstelle...' : '💳 PayLink erstellen'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* PayLink History */}
                    {payLinkHistory.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Erstellte PayLinks (diese Sitzung)</h3>
                            {payLinkHistory.map((pl, idx) => (
                                <div key={idx} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-violet-600">{pl.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR</span>
                                            <span className="text-sm text-muted-foreground">{pl.desc}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 font-mono truncate" title={pl.url}>{pl.url}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{pl.created}</div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => { navigator.clipboard.writeText(pl.url); alert('Link kopiert!'); }}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200 font-bold" title="Link kopieren">
                                            <Copy className="w-3.5 h-3.5" /> Kopieren
                                        </button>
                                        <a href={pl.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium" title="Link öffnen">
                                            <ExternalLink className="w-3.5 h-3.5" /> Öffnen
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* =========== STAMMDATEN & STRIPE =========== */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Stammdaten & Zahlungseinstellungen</h2>

                    <div className="glass-card p-6 border-l-4 border-l-primary">
                        <p className="text-sm text-muted-foreground mb-6">
                            Diese Daten erscheinen auf Ihren Dokumenten als Absender. Die Stripe-Keys aktivieren die Online-Zahlung.
                        </p>
                        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="companyName" className="block text-xs font-medium mb-1">Firmenname</label>
                                <input id="companyName" placeholder="Firma" type="text" value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="block text-xs font-medium mb-1">Inhaber</label>
                                <input id="ownerName" placeholder="Max Mustermann" type="text" value={settings.ownerName} onChange={e => setSettings({ ...settings, ownerName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-xs font-medium mb-1">Adresse</label>
                                <input id="address" placeholder="Musterstraße 1" type="text" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium mb-1">PLZ & Ort</label>
                                <input id="city" placeholder="1010 Wien" type="text" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-xs font-medium mb-1">Telefon</label>
                                <input id="phone" placeholder="+43..." type="text" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium mb-1">E-Mail</label>
                                <input id="email" placeholder="info@beispiel.at" type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="iban" className="block text-xs font-medium mb-1">IBAN (für Vorkasse)</label>
                                <input id="iban" placeholder="AT..." type="text" value={settings.iban} onChange={e => setSettings({ ...settings, iban: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="bic" className="block text-xs font-medium mb-1">BIC</label>
                                <input id="bic" placeholder="BIC" type="text" value={settings.bic} onChange={e => setSettings({ ...settings, bic: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>

                            {/* Stripe Section */}
                            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-violet-600" />
                                    <h3 className="font-bold text-violet-600">Stripe Konfiguration</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="stripePk" className="block text-xs font-medium mb-1">Publishable Key (pk_...)</label>
                                        <input id="stripePk" placeholder="pk_test_..." type="password" value={settings.stripe_publishable_key} onChange={e => setSettings({ ...settings, stripe_publishable_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                    <div>
                                        <label htmlFor="stripeSk" className="block text-xs font-medium mb-1">Secret Key (sk_...)</label>
                                        <input id="stripeSk" placeholder="sk_test_..." type="password" value={settings.stripe_secret_key} onChange={e => setSettings({ ...settings, stripe_secret_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                </div>
                            </div>

                            {/* E-Mail / SMTP / SES Section */}
                            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-blue-600">E-Mail Versand</h3>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="emailProvider" className="block text-xs font-medium mb-1">Provider</label>
                                    <select id="emailProvider" title="E-Mail Provider" value={settings.email_provider} onChange={e => setSettings({ ...settings, email_provider: e.target.value })} className="input-field py-2 text-sm w-full md:w-64 bg-background">
                                        <option value="none">Nicht konfiguriert</option>
                                        <option value="smtp">SMTP / POP (eigener Server)</option>
                                        <option value="ses">AWS SES (Amazon)</option>
                                    </select>
                                </div>

                                {settings.email_provider === 'smtp' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-500/10">
                                        <div>
                                            <label htmlFor="smtpHost" className="block text-xs font-medium mb-1">SMTP Host</label>
                                            <input id="smtpHost" placeholder="smtp.gmail.com" type="text" value={settings.smtp_host} onChange={e => setSettings({ ...settings, smtp_host: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPort" className="block text-xs font-medium mb-1">Port</label>
                                            <input id="smtpPort" placeholder="587" type="text" value={settings.smtp_port} onChange={e => setSettings({ ...settings, smtp_port: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpUser" className="block text-xs font-medium mb-1">Benutzer</label>
                                            <input id="smtpUser" placeholder="user@domain.com" type="text" value={settings.smtp_user} onChange={e => setSettings({ ...settings, smtp_user: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPass" className="block text-xs font-medium mb-1">Passwort</label>
                                            <input id="smtpPass" placeholder="••••••" type="password" value={settings.smtp_pass} onChange={e => setSettings({ ...settings, smtp_pass: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpFromEmail" className="block text-xs font-medium mb-1">Absender E-Mail</label>
                                            <input id="smtpFromEmail" placeholder="noreply@firma.at" type="email" value={settings.smtp_from_email} onChange={e => setSettings({ ...settings, smtp_from_email: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpFromName" className="block text-xs font-medium mb-1">Absender Name</label>
                                            <input id="smtpFromName" placeholder="Meine Firma" type="text" value={settings.smtp_from_name} onChange={e => setSettings({ ...settings, smtp_from_name: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                    </div>
                                )}

                                {settings.email_provider === 'ses' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-500/10">
                                        <div>
                                            <label htmlFor="sesRegion" className="block text-xs font-medium mb-1">AWS Region</label>
                                            <input id="sesRegion" placeholder="eu-central-1" type="text" value={settings.ses_region} onChange={e => setSettings({ ...settings, ses_region: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesFromEmail" className="block text-xs font-medium mb-1">Verifizierte Absender-E-Mail</label>
                                            <input id="sesFromEmail" placeholder="noreply@firma.at" type="email" value={settings.ses_from_email} onChange={e => setSettings({ ...settings, ses_from_email: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesAccessKey" className="block text-xs font-medium mb-1">Access Key ID</label>
                                            <input id="sesAccessKey" placeholder="AKIA..." type="password" value={settings.ses_access_key} onChange={e => setSettings({ ...settings, ses_access_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesSecretKey" className="block text-xs font-medium mb-1">Secret Access Key</label>
                                            <input id="sesSecretKey" placeholder="••••••" type="password" value={settings.ses_secret_key} onChange={e => setSettings({ ...settings, ses_secret_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" disabled={savingSettings} className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> {savingSettings ? 'Speichere...' : 'Alle Einstellungen speichern'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========== ARTICLES =========== */}
            {activeTab === 'articles' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Artikelverwaltung</h2>
                        {!isReadOnlyDemo && (
                            <button onClick={() => setShowArticleForm(!showArticleForm)} className="btn-primary flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" /> Neuer Artikel
                            </button>
                        )}
                    </div>

                    {!isReadOnlyDemo && showArticleForm && (
                        <div className="glass-card p-6 border-l-4 border-l-primary">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Artikel anlegen</h3>
                            <form onSubmit={handleCreateArticle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="new_title" className="block text-xs font-medium mb-1">Titel</label>
                                    <input id="new_title" placeholder="Artikelbezeichnung" type="text" required value={newArticle.title} onChange={e => setNewArticle({ ...newArticle, title: e.target.value })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="new_desc" className="block text-xs font-medium mb-1">Beschreibung</label>
                                    <input id="new_desc" placeholder="Optional" type="text" value={newArticle.description} onChange={e => setNewArticle({ ...newArticle, description: e.target.value })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div>
                                    <label htmlFor="new_price" className="block text-xs font-medium mb-1">Preis (EUR)</label>
                                    <input id="new_price" placeholder="0.00" type="number" step="0.01" required value={newArticle.price} onChange={e => setNewArticle({ ...newArticle, price: parseFloat(e.target.value) || 0 })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setShowArticleForm(false)} className="btn-secondary">Abbrechen</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Speichern</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary/5 border-b border-primary/10 text-muted-foreground uppercase text-[10px] font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Artikel</th>
                                    <th className="px-4 py-3">Beschreibung</th>
                                    <th className="px-4 py-3 text-right">Preis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Keine Artikel.</td></tr>
                                ) : articles.map(a => (
                                    <tr key={a.id} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                                        <td className="px-4 py-3 font-medium">{a.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{a.description || '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-primary">
                                            {Number(a.price).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* =========== DOKUMENTE (INVOICES / ANGEBOTE / EXPOSÉS) =========== */}
            {activeTab === 'invoices' && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1 bg-background rounded-xl border border-border overflow-hidden">
                                {[{ key: 'all', label: 'Alle' }, ...Object.entries(DOC_TYPE_CONFIG).map(([key, v]) => ({ key, label: v.label }))].map(opt => (
                                    <button key={opt.key} onClick={() => setDocTypeFilter(opt.key)}
                                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${docTypeFilter === opt.key ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} title="Statusfilter"
                                className="input-field py-1.5 text-xs bg-background">
                                <option value="all">Alle Status</option>
                                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="text" placeholder="Suche..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="input-field py-2 pl-9 text-sm w-48" />
                            </div>
                            <button onClick={() => fetchData()} className="btn-secondary p-2" title="Aktualisieren">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {!isReadOnlyDemo && (
                                <button onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="btn-primary flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4" /> Neues Dokument
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Neues Dokument Formular */}
                    {!isReadOnlyDemo && showInvoiceForm && (
                        <div className="glass-card p-6 border-l-4 border-l-secondary space-y-6">
                            <h3 className="text-lg font-semibold text-secondary">Neues Dokument erstellen</h3>
                            <form onSubmit={handleCreateInvoice} className="space-y-6">
                                {/* Dokumenttyp */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Typ:</label>
                                    {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <button key={key} type="button"
                                                onClick={() => setNewInvoice({ ...newInvoice, doc_type: key })}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${newInvoice.doc_type === key ? `${cfg.color} border-current bg-current/5` : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                                                <Icon className="w-4 h-4" /> {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Kunde */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Name <span className="text-error">*</span></label>
                                        <input type="text" required value={newInvoice.customer_name} onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })} className="input-field py-2 text-sm w-full" placeholder="Max Mustermann" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">E-Mail</label>
                                        <input type="email" value={newInvoice.customer_email} onChange={e => setNewInvoice({ ...newInvoice, customer_email: e.target.value })} className="input-field py-2 text-sm w-full" placeholder="max@beispiel.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Adresse</label>
                                        <input type="text" value={newInvoice.customer_address} onChange={e => setNewInvoice({ ...newInvoice, customer_address: e.target.value })} className="input-field py-2 text-sm w-full" placeholder="Straße 1, 1010 Wien" />
                                    </div>
                                </div>

                                {/* Faelligkeitsdatum und Zahlungsart */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Faellig am</label>
                                        <input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Zahlungsart</label>
                                        <select value={newInvoice.payment_method} onChange={e => setNewInvoice({ ...newInvoice, payment_method: e.target.value })} className="input-field py-2 text-sm w-full bg-background">
                                            <option value="">Nicht festgelegt</option>
                                            <option value="stripe">Stripe (Online)</option>
                                            <option value="vorkasse">Vorkasse (Überweisung)</option>
                                            <option value="bar">Bar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Notizen</label>
                                        <input type="text" value={newInvoice.notes} onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })} className="input-field py-2 text-sm w-full" placeholder="Optional..." />
                                    </div>
                                </div>

                                {/* Positionen */}
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <h4 className="text-sm font-semibold mb-3">Positionen</h4>
                                    <div className="flex items-end gap-3 flex-wrap">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-medium mb-1">Artikel</label>
                                            <select value={selectedArticleId} onChange={e => setSelectedArticleId(e.target.value)} className="input-field py-2 text-sm w-full bg-background">
                                                <option value="">-- Bitte wählen --</option>
                                                {articles.map(a => (
                                                    <option key={a.id} value={a.id}>{a.title} ({Number(a.price).toLocaleString('de-DE')} €)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-xs font-medium mb-1">Menge</label>
                                            <input type="number" min="1" value={selectedQuantity} onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <button type="button" onClick={handleAddInvoiceItem} disabled={!selectedArticleId} className="btn-secondary py-2 h-[38px] flex items-center gap-2 px-4">
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
                                                            <td className="py-2.5 text-right text-muted-foreground">{item.unit_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                                            <td className="py-2.5 text-right font-medium">{item.total_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                                            <td className="py-2.5 text-right">
                                                                <button type="button" onClick={() => handleRemoveInvoiceItem(idx)} className="text-error hover:bg-error/10 p-1.5 rounded-lg">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-primary/20">
                                                        <td colSpan={3} className="py-3 text-right font-bold">Summe:</td>
                                                        <td className="py-3 text-right font-bold text-primary text-base">{invoiceTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowInvoiceForm(false)} className="btn-secondary">Abbrechen</button>
                                    <button type="submit" disabled={newInvoice.items.length === 0} className="btn-primary flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Dokument speichern
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Dokumentkarten */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground glass-card">
                                {loading ? 'Lade Dokumente...' : 'Keine Dokumente gefunden.'}
                            </div>
                        ) : filteredInvoices.map(inv => {
                            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG['Entwurf'];
                            const docCfg = DOC_TYPE_CONFIG[inv.doc_type] || DOC_TYPE_CONFIG['Rechnung'];
                            const StatusIcon = statusCfg.icon;
                            const DocIcon = docCfg.icon;

                            return (
                                <div key={inv.id} className={`glass-card hover:shadow-xl transition-all duration-300 flex flex-col h-full border-t-4 ${statusCfg.border} relative overflow-hidden`}>
                                    <div className="p-5 flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <DocIcon className={`w-4 h-4 ${docCfg.color} flex-shrink-0`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${docCfg.color}`}>{docCfg.label}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{inv.invoice_number}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-foreground line-clamp-1" title={inv.customer_name}>
                                                    {inv.customer_name}
                                                </h3>
                                            </div>
                                            <div className={`px-2.5 py-1 ${statusCfg.bg} ${statusCfg.color} text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusCfg.border} flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {inv.status}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        {inv.customer_email && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="line-clamp-1">{inv.customer_email}</span>
                                            </div>
                                        )}

                                        {/* Betrag */}
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                            <div className="text-xs font-medium text-muted-foreground">Betrag</div>
                                            <div className="font-bold text-lg text-primary">
                                                {Number(inv.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                            </div>
                                        </div>

                                        {/* Zahlungsmethode */}
                                        {inv.payment_method && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {inv.payment_method === 'stripe' ? <CreditCard className="w-3.5 h-3.5 text-violet-500" /> : <Banknote className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span>{inv.payment_method === 'stripe' ? 'Stripe' : inv.payment_method === 'vorkasse' ? 'Vorkasse' : inv.payment_method}</span>
                                                {inv.paid_at && <span className="text-emerald-600 font-medium ml-auto">bezahlt am {new Date(inv.paid_at).toLocaleDateString('de-DE')}</span>}
                                            </div>
                                        )}

                                    </div>

                                    {/* Aktionen */}
                                    <div className="p-3 border-t border-primary/10 bg-background/50 space-y-2 mt-auto">
                                        {/* Status-Buttons */}
                                        {!isReadOnlyDemo && inv.status !== 'Bezahlt' && inv.status !== 'Storniert' && (
                                            <div className="flex gap-1 flex-wrap">
                                                {inv.doc_type === 'Rechnung' && inv.status === 'Entwurf' && (
                                                    <button onClick={() => handleUpdateStatus(inv.id, 'Offen')} className="text-[10px] px-2 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 font-medium">Versenden</button>
                                                )}
                                                {inv.status === 'Offen' && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(inv.id, 'Bezahlt')} className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium">Bezahlt</button>
                                                        <button onClick={() => handleUpdateStatus(inv.id, 'Inkasso')} className="text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium">Inkasso</button>
                                                    </>
                                                )}
                                                {inv.status === 'Inkasso' && (
                                                    <button onClick={() => handleUpdateStatus(inv.id, 'Bezahlt')} className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium">Bezahlt</button>
                                                )}
                                                <button onClick={() => handleUpdateStatus(inv.id, 'Storniert')} className="text-[10px] px-2 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 font-medium">Stornieren</button>
                                            </div>
                                        )}

                                        {/* Zahlungsaktionen */}
                                        {!isReadOnlyDemo && inv.doc_type === 'Rechnung' && inv.status !== 'Bezahlt' && inv.status !== 'Storniert' && (
                                            <div className="space-y-1.5">
                                                {inv.stripe_payment_link ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => { navigator.clipboard.writeText(inv.stripe_payment_link); alert('PayLink kopiert!'); }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-2 rounded-md bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200 font-bold" title="Stripe PayLink kopieren">
                                                            <Copy className="w-3 h-3" /> PayLink kopieren
                                                        </button>
                                                        <a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-1 px-2.5 py-2 text-[10px] rounded-md bg-violet-600 text-white hover:bg-violet-700 font-medium" title="PayLink öffnen">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                        <button onClick={() => handleCreateStripeLink(inv.id)} disabled={creatingPaymentLink === inv.id}
                                                            className="flex items-center justify-center gap-1 px-2.5 py-2 text-[10px] rounded-md bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 font-medium disabled:opacity-50" title="Neuen PayLink erstellen">
                                                            <RefreshCw className={`w-3 h-3 ${creatingPaymentLink === inv.id ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleCreateStripeLink(inv.id)} disabled={creatingPaymentLink === inv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 font-bold shadow-sm disabled:opacity-50 transition-all" title="Stripe PayLink erstellen">
                                                            <CreditCard className="w-3.5 h-3.5" /> {creatingPaymentLink === inv.id ? 'Erstelle...' : '💳 Stripe PayLink erstellen'}
                                                        </button>
                                                        <button onClick={() => handleSetVorkasse(inv.id)}
                                                            className="flex items-center justify-center gap-1.5 text-[10px] px-3 py-2 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium" title="Vorkasse setzen">
                                                            <Banknote className="w-3 h-3" /> Vorkasse
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* PDF, E-Mail & Teilen */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={() => handleDownloadPDF(inv)} className="btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs" title="PDF herunterladen">
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </button>
                                            {inv.customer_email && !isReadOnlyDemo ? (
                                                <button onClick={() => handleSendEmail(inv.id)} disabled={sendingEmail === inv.id}
                                                    className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50" title="Per E-Mail senden">
                                                    <Mail className="w-3.5 h-3.5" /> {sendingEmail === inv.id ? '...' : 'Mail'}
                                                </button>
                                            ) : (
                                                <button onClick={() => handleShare(inv)} className="btn-primary flex items-center justify-center gap-1.5 py-2 text-xs" title="Teilen">
                                                    <Send className="w-3.5 h-3.5" /> Teilen
                                                </button>
                                            )}
                                            <button onClick={() => handleShare(inv)} className="btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs" title="Via App teilen">
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                            {!isReadOnlyDemo && (
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors" title="Loeschen">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
