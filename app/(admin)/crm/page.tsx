'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';
import { useLanguage } from '@/lib/language-context';
import {
    PlusCircle, Box, FileText, Download, Send, Save, User,
    Search, Trash2, Mail, CreditCard, Banknote,
    AlertTriangle, CheckCircle2, Clock, XCircle, FileSpreadsheet,
    Home, ExternalLink, Copy, RefreshCw, Link2, Pencil
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
    const { t } = useLanguage();
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const [activeTab, setActiveTab] = useState<'invoices' | 'articles' | 'paylink' | 'settings'>('invoices');

    // PayLink Generator State
    const [payLinkAmount, setPayLinkAmount] = useState('');
    const [payLinkDesc, setPayLinkDesc] = useState('');
    const [payLinkEmail, setPayLinkEmail] = useState('');
    const [payLinkCreating, setPayLinkCreating] = useState(false);
    const [payLinkHistory, setPayLinkHistory] = useState<Array<{url: string; amount: number; desc: string; created: string}>>([]);

    const handleCreateQuickPayLink = async () => {
        if (!payLinkAmount || parseFloat(payLinkAmount) <= 0) { alert(t('crm.enter_amount')); return; }
        setPayLinkCreating(true);
        try {
            const res = await fetch('/api/crm/stripe/quick-paylink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: payLinkAmount, description: payLinkDesc || t('crm.payment'), customer_email: payLinkEmail || undefined })
            });
            const data = await res.json();
            if (data.success && data.payment_url) {
                await navigator.clipboard.writeText(data.payment_url);
                setPayLinkHistory(prev => [{ url: data.payment_url, amount: data.amount, desc: payLinkDesc || t('crm.payment'), created: new Date().toLocaleString(t('locale') || 'de-DE') }, ...prev]);
                setPayLinkAmount(''); setPayLinkDesc(''); setPayLinkEmail('');
                alert(t('crm.paylink_created_copied'));
            } else {
                alert(t('crm.error_prefix') + (data.error || t('crm.unknown_error')));
            }
        } catch { alert(t('crm.network_error')); } finally { setPayLinkCreating(false); }
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
        paypal_client_id: '',
        paypal_secret: '',
        paypal_mode: 'sandbox',
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
            if (res.ok) alert(t('crm.settings_saved'));
            else alert(t('crm.settings_save_error'));
        } catch { alert(t('crm.network_error')); } finally { setSavingSettings(false); }
    };

    const [articles, setArticles] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

    const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
    const [selectedArticleId, setSelectedArticleId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    const handleEditInvoice = (inv: any) => {
        setEditingInvoiceId(inv.id);
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        const dueDateStr = (dueDate && !isNaN(dueDate.getTime())) ? dueDate.toISOString().split('T')[0] : '';
        
        setNewInvoice({
            customer_name: inv.customer_name || '',
            customer_email: inv.customer_email || '',
            customer_address: inv.customer_address || '',
            doc_type: inv.doc_type || 'Rechnung',
            status: inv.status || 'Entwurf',
            payment_method: inv.payment_method || '',
            notes: inv.notes || '',
            due_date: dueDateStr,
            items: (inv.items || []).map((item: any) => ({
                article_id: item.article_id,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
            }))
        });
        setShowInvoiceForm(true);
        // Scroll to form
        const formEl = document.getElementById('invoice-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    };

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
                alert(t('crm.email_sent') + ' ' + data.provider + '!');
                fetchData();
            } else {
                alert(t('crm.email_error') + ' ' + data.error);
            }
        } catch { alert(t('crm.email_network_error')); }
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
        if (!newInvoice.customer_name) {
            alert(t('crm.customer_name_required') || 'Kundenname erforderlich');
            return;
        }
        if (newInvoice.items.length === 0) {
            alert(t('crm.items_empty_alert') || 'Bitte fügen Sie mindestens einen Artikel hinzu');
            return;
        }

        setIsSaving(true);
        try {
            const method = editingInvoiceId ? 'PATCH' : 'POST';
            const url = editingInvoiceId ? `/api/crm/invoices/${editingInvoiceId}` : '/api/crm/invoices';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newInvoice,
                    total_amount: invoiceTotal
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(t('crm.save_success') || 'Erfolgreich gespeichert');
                setNewInvoice({
                    customer_name: '', customer_email: '', customer_address: '',
                    doc_type: 'Rechnung', status: 'Entwurf', payment_method: '', notes: '', due_date: '',
                    items: []
                });
                setEditingInvoiceId(null);
                setShowInvoiceForm(false);
                fetchData();
            } else {
                alert(t('crm.save_error') + ': ' + (data.error || t('crm.unknown_error')));
            }
        } catch (error) {
            console.error('Failed to save invoice', error);
            alert(t('crm.network_error'));
        } finally {
            setIsSaving(false);
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
        if (!confirm(t('crm.delete_confirm'))) return;
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
                alert(t('crm.stripe_link_created') + '\n\n' + data.payment_url);
                fetchData();
            } else {
                alert(t('crm.error_prefix') + (data.error || t('crm.unknown_error')));
            }
        } catch (error) {
            console.error('Stripe link error', error);
            alert(t('crm.stripe_link_error'));
        } finally {
            setCreatingPaymentLink(null);
        }
    };

    const handleCopyPaymentLandingPageLink = async (invoiceId: number) => {
        const origin = window.location.origin;
        const url = `${origin}/payment/${invoiceId}`;
        await navigator.clipboard.writeText(url);
        alert(t('crm.link_copied') + '\n\n' + url);
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
        try {
            const doc = new jsPDF();
            const docTypeLabel = t('crm.doctype_' + (invoice.doc_type || 'rechnung').toLowerCase());

            doc.setFontSize(22);
            doc.text(docTypeLabel.toUpperCase(), 14, 20);

            doc.setFontSize(10);
            const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
            const issueDateStr = isNaN(issueDate.getTime()) ? new Date().toLocaleDateString(t('locale') || 'de-DE') : issueDate.toLocaleDateString(t('locale') || 'de-DE');
            
            doc.text(`${t('crm.pdf.no')} ${invoice.invoice_number || '---'}`, 14, 30);
            doc.text(`${t('crm.pdf.date')} ${issueDateStr}`, 14, 36);
            
            if (invoice.due_date) {
                const dueDate = new Date(invoice.due_date);
                if (!isNaN(dueDate.getTime())) {
                    doc.text(`${t('crm.pdf.due_date')} ${dueDate.toLocaleDateString(t('locale') || 'de-DE')}`, 14, 42);
                }
            }

            doc.setFontSize(12);
            doc.text(settings.companyName || t('crm.pdf.default_company'), 130, 20);
            doc.setFontSize(10);
            doc.text(settings.address || '', 130, 26);
            doc.text(settings.city || '', 130, 32);
            if (settings.phone) doc.text(settings.phone, 130, 38);
            if (settings.email) doc.text(settings.email, 130, 44);

            doc.setFontSize(12);
            doc.text(t('crm.pdf.recipient'), 14, 54);
            doc.setFontSize(10);
            doc.text(invoice.customer_name || t('crm.pdf.unknown_recipient'), 14, 60);
            if (invoice.customer_address) doc.text(invoice.customer_address, 14, 66);
            if (invoice.customer_email) doc.text(invoice.customer_email, 14, 72);

            const startY = 85;
            (doc as any).autoTable({
                startY,
                head: [[t('crm.pdf.table_pos'), t('crm.pdf.table_qty'), t('crm.pdf.table_unit'), t('crm.pdf.table_total')]],
                body: invoice.items && invoice.items.length > 0 
                    ? invoice.items.map((item: any) => [
                        item.description || item.title || '---',
                        (item.quantity || 1).toString(),
                        `${Number(item.unit_price || 0).toLocaleString(t('locale') || 'de-DE', { minimumFractionDigits: 2 })} EUR`,
                        `${Number(item.total_price || 0).toLocaleString(t('locale') || 'de-DE', { minimumFractionDigits: 2 })} EUR`
                    ])
                    : [
                        [t('crm.pdf.table_total_pos'), '1', `${invoice.total_amount || 0} EUR`, `${invoice.total_amount || 0} EUR`]
                    ],
                theme: 'striped',
                headStyles: { fillColor: [0, 74, 124] } // Primary color
            });

            const finalY = (doc as any).lastAutoTable.finalY || startY + 20;
            doc.setFontSize(14);
            doc.text(`${t('crm.pdf.total_amount')} ${Number(invoice.total_amount || 0).toLocaleString(t('locale') || 'de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`, 14, finalY + 15);

            // Zahlungsinformationen
            const payY = finalY + 30;
            doc.setFontSize(10);
            if (invoice.payment_method === 'stripe' && invoice.stripe_payment_link) {
                doc.text(`${t('crm.pdf.payment_via_stripe')} ${invoice.stripe_payment_link}`, 14, payY);
            } else {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                doc.text(`Online bezahlen: ${origin}/payment/${invoice.id}`, 14, payY);
                if (settings.iban) {
                    doc.text(`${t('crm.pdf.bank_details')} ${settings.iban} ${settings.bic ? t('crm.pdf.bic') + settings.bic : ''}`, 14, payY + 8);
                    doc.text(t('crm.pdf.transfer_request'), 14, payY + 14);
                }
            }

            if (invoice.notes) {
                doc.text(`${t('crm.pdf.notes')} ${invoice.notes}`, 14, payY + 20);
            }

            return doc.output('blob');
        } catch (err) {
            console.error('PDF Generation failed:', err);
            return new Blob();
        }
    };

    const handleDownloadPDF = (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const prefixLabel = invoice.doc_type === 'Rechnung' ? t('crm.doctype_rechnung') :
                            invoice.doc_type === 'Angebot' ? t('crm.doctype_angebot') :
                            invoice.doc_type === 'Exposé' ? t('crm.doctype_expose') : t('crm.tab_documents');
        link.download = `${prefixLabel}_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = (invoice: any) => {
        const origin = window.location.origin;
        const url = `${origin}/payment/${invoice.id}`;
        const prefixLabel = invoice.doc_type === 'Rechnung' ? t('crm.doctype_rechnung') :
                            invoice.doc_type === 'Angebot' ? t('crm.doctype_angebot') :
                            invoice.doc_type === 'Exposé' ? t('crm.doctype_expose') : t('crm.tab_documents');
        
        const text = `Hallo, anbei der Link zum ${prefixLabel} ${invoice.invoice_number} von ${settings.companyName || 'uns'}: ${url}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    const handleShareNative = async (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const prefixLabel = invoice.doc_type === 'Rechnung' ? t('crm.doctype_rechnung') :
                            invoice.doc_type === 'Angebot' ? t('crm.doctype_angebot') :
                            invoice.doc_type === 'Exposé' ? t('crm.doctype_expose') : t('crm.tab_documents');
        const file = new File([blob], `${prefixLabel}_${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `${prefixLabel} ${invoice.invoice_number}`,
                    text: `${t('crm.pdf.hello_attached')} ${prefixLabel} ${invoice.invoice_number}.`
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
                    {t('crm.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('crm.description')}
                </p>
            </div>

            {isReadOnlyDemo && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                    {t('crm.demo_mode')}
                </div>
            )}

            {/* KPI Karten */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 border-l-4 border-l-orange-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{t('crm.open_sum')}</div>
                    <div className="text-xl font-bold text-orange-600">{totalOffen.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Offen').length} {t('crm.documents')}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-emerald-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{t('crm.paid')}</div>
                    <div className="text-xl font-bold text-emerald-600">{totalBezahlt.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Bezahlt').length} {t('crm.documents')}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-red-400">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{t('crm.collection')}</div>
                    <div className="text-xl font-bold text-red-600">{totalInkasso.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</div>
                    <div className="text-xs text-muted-foreground">{invoices.filter(i => i.status === 'Inkasso').length} {t('crm.documents')}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-primary">
                    <div className="text-xs text-muted-foreground font-medium mb-1">{t('crm.total')}</div>
                    <div className="text-xl font-bold text-primary">{invoices.length}</div>
                    <div className="text-xs text-muted-foreground">{t('crm.documents_total')}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-primary/20 overflow-x-auto">
                <button onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <FileText className="w-5 h-5" /> {t('crm.tab_documents')}
                </button>
                <button onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'articles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Box className="w-5 h-5" /> {t('crm.tab_articles')}
                </button>
                <button onClick={() => setActiveTab('paylink')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'paylink' ? 'border-violet-600 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Link2 className="w-5 h-5" /> PayLink
                </button>
                <button onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <User className="w-5 h-5" /> {t('crm.tab_settings')}
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
                            {t('crm.paylink_desc')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label htmlFor="plAmount" className="block text-xs font-medium mb-1">{t('crm.amount_eur')} <span className="text-red-500">*</span></label>
                                <input id="plAmount" type="number" step="0.01" min="0.50" placeholder={t('crm.amount_placeholder')} value={payLinkAmount} onChange={e => setPayLinkAmount(e.target.value)}
                                    className="input-field py-3 text-lg font-bold w-full" />
                            </div>
                            <div>
                                <label htmlFor="plDesc" className="block text-xs font-medium mb-1">{t('crm.desc_label')}</label>
                                <input id="plDesc" type="text" placeholder={t('crm.desc_placeholder')} value={payLinkDesc} onChange={e => setPayLinkDesc(e.target.value)}
                                    className="input-field py-3 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="plEmail" className="block text-xs font-medium mb-1">{t('crm.customer_email_optional')}</label>
                                <input id="plEmail" type="email" placeholder="john.doe@example.com" value={payLinkEmail} onChange={e => setPayLinkEmail(e.target.value)}
                                    className="input-field py-3 text-sm w-full" />
                            </div>
                            <div>
                                <button onClick={handleCreateQuickPayLink} disabled={payLinkCreating || !payLinkAmount}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm hover:from-violet-600 hover:to-violet-700 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {payLinkCreating ? t('crm.creating') : t('crm.create_paylink')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* PayLink History */}
                    {payLinkHistory.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('crm.created_paylinks')}</h3>
                            {payLinkHistory.map((pl, idx) => (
                                <div key={idx} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-violet-600">{pl.amount.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} EUR</span>
                                            <span className="text-sm text-muted-foreground">{pl.desc}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 font-mono truncate" title={pl.url}>{pl.url}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{pl.created}</div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => { navigator.clipboard.writeText(pl.url); alert(t('crm.link_copied')); }}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200 font-bold" title="Link kopieren">
                                            <Copy className="w-3.5 h-3.5" /> {t('crm.copy')}
                                        </button>
                                        <a href={pl.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium" title={t('crm.open_link')}>
                                            <ExternalLink className="w-3.5 h-3.5" /> {t('crm.open')}
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
                    <h2 className="text-xl font-bold">{t('crm.settings_title')}</h2>

                    <div className="glass-card p-6 border-l-4 border-l-primary">
                        <p className="text-sm text-muted-foreground mb-6">
                            {t('crm.settings_desc')}
                        </p>
                        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="companyName" className="block text-xs font-medium mb-1">{t('crm.company_name')}</label>
                                <input id="companyName" title={t('crm.company_name')} placeholder={t('crm.company_placeholder')} type="text" value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="block text-xs font-medium mb-1">{t('crm.owner')}</label>
                                <input id="ownerName" title={t('crm.owner')} placeholder="Max Mustermann" type="text" value={settings.ownerName} onChange={e => setSettings({ ...settings, ownerName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-xs font-medium mb-1">{t('crm.address')}</label>
                                <input id="address" title={t('crm.address')} placeholder="Musterstraße 1" type="text" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium mb-1">{t('crm.zip_city')}</label>
                                <input id="city" title={t('crm.zip_city')} placeholder="1010 Wien" type="text" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-xs font-medium mb-1">{t('crm.phone')}</label>
                                <input id="phone" title={t('crm.phone')} placeholder="+43..." type="text" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium mb-1">{t('crm.email')}</label>
                                <input id="email" title={t('crm.email')} placeholder={t('crm.email_placeholder')} type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="iban" className="block text-xs font-medium mb-1">{t('crm.iban_label')}</label>
                                <input id="iban" title={t('crm.iban_label')} placeholder="AT..." type="text" value={settings.iban} onChange={e => setSettings({ ...settings, iban: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="bic" className="block text-xs font-medium mb-1">{t('crm.bic')}</label>
                                <input id="bic" title="BIC" placeholder="BIC" type="text" value={settings.bic} onChange={e => setSettings({ ...settings, bic: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>

                            {/* Stripe Section */}
                            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-violet-600" />
                                    <h3 className="font-bold text-violet-600">{t('crm.stripe_config')}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="stripePk" className="block text-xs font-medium mb-1">{t('crm.publishable_key')}</label>
                                        <input id="stripePk" title={t('crm.publishable_key')} placeholder="pk_test_..." type="password" value={settings.stripe_publishable_key} onChange={e => setSettings({ ...settings, stripe_publishable_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                    <div>
                                        <label htmlFor="stripeSk" className="block text-xs font-medium mb-1">{t('crm.secret_key')}</label>
                                        <input id="stripeSk" title={t('crm.secret_key')} placeholder="sk_test_..." type="password" value={settings.stripe_secret_key} onChange={e => setSettings({ ...settings, stripe_secret_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                </div>
                            </div>

                            {/* PayPal Section */}
                            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-blue-600/5 border border-blue-600/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-5 h-5 flex items-center justify-center text-blue-600 font-bold italic font-serif text-lg">P</div>
                                    <h3 className="font-bold text-blue-600">{t('crm.paypal_config')}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="paypalMode" className="block text-xs font-medium mb-1">{t('crm.paypal_mode')}</label>
                                        <select id="paypalMode" title={t('crm.paypal_mode')} value={settings.paypal_mode} onChange={e => setSettings({ ...settings, paypal_mode: e.target.value })} className="input-field py-2 text-sm w-full md:w-48 bg-background">
                                            <option value="sandbox">Sandbox (Test)</option>
                                            <option value="live">Live (Echtzeit)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="paypalClientId" className="block text-xs font-medium mb-1">{t('crm.paypal_client_id')}</label>
                                        <input id="paypalClientId" title={t('crm.paypal_client_id')} placeholder="Aa_..." type="password" value={settings.paypal_client_id} onChange={e => setSettings({ ...settings, paypal_client_id: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                    <div>
                                        <label htmlFor="paypalSecret" className="block text-xs font-medium mb-1">{t('crm.paypal_secret')}</label>
                                        <input id="paypalSecret" title={t('crm.paypal_secret')} placeholder="EM_..." type="password" value={settings.paypal_secret} onChange={e => setSettings({ ...settings, paypal_secret: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                    </div>
                                </div>
                            </div>

                            {/* E-Mail / SMTP / SES Section */}
                            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-blue-600">{t('crm.email_dispatch')}</h3>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="emailProvider" className="block text-xs font-medium mb-1">{t('crm.provider')}</label>
                                    <select id="emailProvider" title={t('crm.provider')} value={settings.email_provider} onChange={e => setSettings({ ...settings, email_provider: e.target.value })} className="input-field py-2 text-sm w-full md:w-64 bg-background">
                                        <option value="none">{t('crm.not_configured')}</option>
                                        <option value="smtp">{t('crm.smtp_own_server')}</option>
                                        <option value="ses">{t('crm.aws_ses')}</option>
                                    </select>
                                </div>

                                {settings.email_provider === 'smtp' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-500/10">
                                        <div>
                                            <label htmlFor="smtpHost" className="block text-xs font-medium mb-1">{t('crm.smtp_host')}</label>
                                            <input id="smtpHost" title={t('crm.smtp_host')} placeholder="smtp.gmail.com" type="text" value={settings.smtp_host} onChange={e => setSettings({ ...settings, smtp_host: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPort" className="block text-xs font-medium mb-1">{t('crm.port')}</label>
                                            <input id="smtpPort" title={t('crm.port')} placeholder="587" type="text" value={settings.smtp_port} onChange={e => setSettings({ ...settings, smtp_port: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpUser" className="block text-xs font-medium mb-1">{t('crm.user')}</label>
                                            <input id="smtpUser" title={t('crm.user')} placeholder="user@domain.com" type="text" value={settings.smtp_user} onChange={e => setSettings({ ...settings, smtp_user: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPass" className="block text-xs font-medium mb-1">{t('crm.password')}</label>
                                            <input id="smtpPass" title={t('crm.password')} placeholder="••••••" type="password" value={settings.smtp_pass} onChange={e => setSettings({ ...settings, smtp_pass: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpFromEmail" className="block text-xs font-medium mb-1">{t('crm.sender_email')}</label>
                                            <input id="smtpFromEmail" title={t('crm.sender_email')} placeholder="noreply@firma.at" type="email" value={settings.smtp_from_email} onChange={e => setSettings({ ...settings, smtp_from_email: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <div>
                                            <label htmlFor="smtpFromName" className="block text-xs font-medium mb-1">{t('crm.sender_name')}</label>
                                            <input id="smtpFromName" title={t('crm.sender_name')} placeholder="Meine Firma" type="text" value={settings.smtp_from_name} onChange={e => setSettings({ ...settings, smtp_from_name: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                    </div>
                                )}

                                {settings.email_provider === 'ses' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-500/10">
                                        <div>
                                            <label htmlFor="sesRegion" className="block text-xs font-medium mb-1">{t('crm.aws_region')}</label>
                                            <input id="sesRegion" title={t('crm.aws_region')} placeholder="eu-central-1" type="text" value={settings.ses_region} onChange={e => setSettings({ ...settings, ses_region: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesFromEmail" className="block text-xs font-medium mb-1">{t('crm.verified_sender')}</label>
                                            <input id="sesFromEmail" title={t('crm.verified_sender')} placeholder="noreply@firma.at" type="email" value={settings.ses_from_email} onChange={e => setSettings({ ...settings, ses_from_email: e.target.value })} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesAccessKey" className="block text-xs font-medium mb-1">{t('crm.access_key')}</label>
                                            <input id="sesAccessKey" title={t('crm.access_key')} placeholder="AKIA..." type="password" value={settings.ses_access_key} onChange={e => setSettings({ ...settings, ses_access_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                        <div>
                                            <label htmlFor="sesSecretKey" className="block text-xs font-medium mb-1">{t('crm.secret_access_key')}</label>
                                            <input id="sesSecretKey" title={t('crm.secret_access_key')} placeholder="••••••" type="password" value={settings.ses_secret_key} onChange={e => setSettings({ ...settings, ses_secret_key: e.target.value })} className="input-field py-2 text-sm w-full font-mono" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" title={t('crm.save_all_settings')} disabled={savingSettings} className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> {savingSettings ? t('crm.saving') : t('crm.save_all_settings')}
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
                        <h2 className="text-xl font-bold">{t('crm.article_management')}</h2>
                        {!isReadOnlyDemo && (
                            <button onClick={() => setShowArticleForm(!showArticleForm)} className="btn-primary flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" /> {t('crm.new_article')}
                            </button>
                        )}
                    </div>

                    {!isReadOnlyDemo && showArticleForm && (
                        <div className="glass-card p-6 border-l-4 border-l-primary">
                            <h3 className="text-lg font-semibold mb-4 text-primary">{t('crm.create_article')}</h3>
                            <form onSubmit={handleCreateArticle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="new_title" className="block text-xs font-medium mb-1">{t('crm.article_title')}</label>
                                    <input id="new_title" title={t('crm.article_title')} placeholder={t('crm.article_title_placeholder')} type="text" required value={newArticle.title} onChange={e => setNewArticle({ ...newArticle, title: e.target.value })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="new_desc" className="block text-xs font-medium mb-1">{t('crm.desc_label')}</label>
                                    <input id="new_desc" title={t('crm.desc_label')} placeholder={t('crm.optional')} type="text" value={newArticle.description} onChange={e => setNewArticle({ ...newArticle, description: e.target.value })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div>
                                    <label htmlFor="new_price" className="block text-xs font-medium mb-1">{t('crm.price_eur')}</label>
                                    <input id="new_price" title={t('crm.price_eur')} placeholder="0.00" type="number" step="0.01" required value={newArticle.price} onChange={e => setNewArticle({ ...newArticle, price: parseFloat(e.target.value) || 0 })} className="input-field py-2 text-sm w-full" />
                                </div>
                                <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setShowArticleForm(false)} className="btn-secondary">{t('crm.cancel')}</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {t('crm.save')}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary/5 border-b border-primary/10 text-muted-foreground uppercase text-[10px] font-semibold">
                                <tr>
                                    <th className="px-4 py-3">{t('crm.article')}</th>
                                    <th className="px-4 py-3">{t('crm.desc_label')}</th>
                                    <th className="px-4 py-3 text-right">{t('crm.price')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">{t('crm.no_articles')}</td></tr>
                                ) : articles.map(a => (
                                    <tr key={a.id} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                                        <td className="px-4 py-3 font-medium">{t(a.title)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{a.description ? t(a.description) : '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-primary">
                                            {Number(a.price).toLocaleString(t('locale') || 'de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
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
                                {[{ key: 'all', label: t('table.all') }, ...Object.entries(DOC_TYPE_CONFIG).map(([key, v]) => ({ key, label: t('crm.doctype_' + key.toLowerCase()) }))].map(opt => (
                                    <button key={opt.key} onClick={() => setDocTypeFilter(opt.key)}
                                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${docTypeFilter === opt.key ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} title={t("table.filter_status")}
                                className="input-field py-1.5 text-xs bg-background">
                                <option value="all">{t('table.all_statuses')}</option>
                                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{t('crm.status_' + s.toLowerCase())}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <input type="text" placeholder={t("action.search")} title={t("action.search")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="input-field py-2 pl-11 text-sm w-48 transition-all" />
                            </div>
                            <button onClick={() => fetchData()} className="btn-secondary p-2" title={t("action.refresh")}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {!isReadOnlyDemo && (
                                <button onClick={() => { setEditingInvoiceId(null); setNewInvoice({ customer_name: '', customer_email: '', customer_address: '', doc_type: 'Rechnung', status: 'Entwurf', payment_method: '', notes: '', due_date: '', items: [] }); setShowInvoiceForm(!showInvoiceForm); }} className="btn-primary flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4" /> {t('crm.new_document')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* {t('crm.new_document')} Formular */}
                    {!isReadOnlyDemo && showInvoiceForm && (
                        <div id="invoice-form" className="glass-card p-6 border-l-4 border-l-secondary space-y-6">
                            <h3 className="text-lg font-semibold text-secondary">{editingInvoiceId ? t('action.edit') : t('crm.new_document')}</h3>
                            <form onSubmit={handleCreateInvoice} className="space-y-6">
                                {/* Dokumenttyp */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('crm.doc_type')}</label>
                                    {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <button key={key} type="button"
                                                onClick={() => setNewInvoice({ ...newInvoice, doc_type: key })}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${newInvoice.doc_type === key ? `${cfg.color} border-current bg-current/5` : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                                                <Icon className="w-4 h-4" /> {t('crm.doctype_' + key.toLowerCase())}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Kunde */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.name')} <span className="text-error">*</span></label>
                                        <input type="text" required title={t('crm.name')} placeholder="Max Mustermann" value={newInvoice.customer_name} onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.email')}</label>
                                        <input type="email" title={t('crm.email')} placeholder="max@beispiel.com" value={newInvoice.customer_email} onChange={e => setNewInvoice({ ...newInvoice, customer_email: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.address')}</label>
                                        <input type="text" title={t('crm.address')} placeholder={t('crm.address_placeholder')} value={newInvoice.customer_address} onChange={e => setNewInvoice({ ...newInvoice, customer_address: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                </div>

                                {/* Faelligkeitsdatum und Zahlungsart */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.due_date')}</label>
                                        <input type="date" title={t('crm.due_date')} value={newInvoice.due_date} onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.payment_method')}</label>
                                        <select title={t('crm.payment_method')} value={newInvoice.payment_method} onChange={e => setNewInvoice({ ...newInvoice, payment_method: e.target.value })} className="input-field py-2 text-sm w-full bg-background">
                                            <option value="">{t('crm.payment_not_set')}</option>
                                            <option value="stripe">{t('crm.payment_stripe')}</option>
                                            <option value="paypal">{t('crm.payment_paypal')}</option>
                                            <option value="vorkasse">{t('crm.payment_prepay')}</option>
                                            <option value="bar">{t('crm.payment_cash')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">{t('crm.notes')}</label>
                                        <input type="text" title={t('crm.notes')} placeholder={t('crm.notes_placeholder')} value={newInvoice.notes} onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })} className="input-field py-2 text-sm w-full" />
                                    </div>
                                </div>

                                {/* Positionen */}
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <h4 className="text-sm font-semibold mb-3">{t('crm.positions')}</h4>
                                    <div className="flex items-end gap-3 flex-wrap">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-medium mb-1">{t('crm.article')}</label>
                                            <select id="article-select" title={t('crm.article')} value={selectedArticleId} onChange={e => setSelectedArticleId(e.target.value)} className="input-field py-2 text-sm w-full bg-background">
                                                <option value="">{t('crm.select_please')}</option>
                                                {articles.map(a => (
                                                    <option key={a.id} value={a.id}>{t(a.title)} ({Number(a.price).toLocaleString(t('locale') || 'de-DE')} €)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-xs font-medium mb-1">{t('crm.quantity')}</label>
                                            <input id="quantity-input" type="number" title={t('crm.quantity')} min="1" value={selectedQuantity} onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)} className="input-field py-2 text-sm w-full" />
                                        </div>
                                        <button type="button" onClick={handleAddInvoiceItem} disabled={!selectedArticleId} className="btn-secondary py-2 h-[38px] flex items-center gap-2 px-4">
                                            <PlusCircle className="w-4 h-4" /> {t('crm.add')}
                                        </button>
                                    </div>

                                    {newInvoice.items.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-primary/10">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs text-muted-foreground border-b border-primary/10">
                                                        <th className="pb-2">{t('crm.position')}</th>
                                                        <th className="pb-2 text-center">{t('crm.quantity')}</th>
                                                        <th className="pb-2 text-right">{t('crm.unit_price')}</th>
                                                        <th className="pb-2 text-right">{t('crm.total')}</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {newInvoice.items.map((item, idx) => (
                                                        <tr key={idx} className="border-b border-primary/5 last:border-0">
                                                            <td className="py-2.5 font-medium">{t(item.title)}</td>
                                                            <td className="py-2.5 text-center">{item.quantity}</td>
                                                            <td className="py-2.5 text-right text-muted-foreground">{item.unit_price.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</td>
                                                            <td className="py-2.5 text-right font-medium">{item.total_price.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</td>
                                                            <td className="py-2.5 text-right">
                                                                <button type="button" onClick={() => handleRemoveInvoiceItem(idx)} className="text-error hover:bg-error/10 p-1.5 rounded-lg" title={t('action.delete')}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-primary/20">
                                                        <td colSpan={3} className="py-3 text-right font-bold">{t('crm.sum')}</td>
                                                        <td className="py-3 text-right font-bold text-primary text-base">{invoiceTotal.toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    {editingInvoiceId && (
                                        <button type="button" onClick={() => { setEditingInvoiceId(null); setShowInvoiceForm(false); }} className="btn-secondary">
                                            {t('crm.cancel')}
                                        </button>
                                    )}
                                    <button type="submit" disabled={isSaving || newInvoice.items.length === 0} className="btn-primary flex items-center gap-2">
                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSaving ? (t('action.saving') || 'Speichert...') : (editingInvoiceId ? (t('action.save') || 'Speichern') : (t('crm.save_document') || 'Dokument speichern'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Dokumentkarten */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground glass-card">
                                {loading ? t('crm.loading_documents') : t('crm.no_documents')}
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
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${docCfg.color}`}>{t('crm.doctype_' + inv.doc_type.toLowerCase())}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{inv.invoice_number}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-foreground line-clamp-1" title={inv.customer_name}>
                                                    {inv.customer_name}
                                                </h3>
                                            </div>
                                            <div className={`px-2.5 py-1 ${statusCfg.bg} ${statusCfg.color} text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusCfg.border} flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {t('crm.status_' + inv.status.toLowerCase())}
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
                                            <div className="text-xs font-medium text-muted-foreground">{t('crm.amount')}</div>
                                            <div className="font-bold text-lg text-primary">
                                                {Number(inv.total_amount).toLocaleString(t('locale') || 'de-DE',  { minimumFractionDigits: 2 })} €
                                            </div>
                                        </div>

                                        {/* Zahlungsmethode */}
                                        {inv.payment_method && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {inv.payment_method === 'stripe' ? <CreditCard className="w-3.5 h-3.5 text-violet-500" /> : 
                                                 inv.payment_method === 'paypal' ? <div className="w-3.5 h-3.5 text-blue-500 font-bold">P</div> :
                                                 <Banknote className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span>{inv.payment_method === "stripe" ? t("crm.payment_stripe") : 
                                                       inv.payment_method === "paypal" ? t("crm.payment_paypal") :
                                                       inv.payment_method === "vorkasse" ? t("crm.payment_prepay") : 
                                                       inv.payment_method === "bar" ? t("crm.payment_cash") : 
                                                       inv.payment_method}</span>
                                                {inv.paid_at && <span className="text-emerald-600 font-medium ml-auto">{t('crm.paid_on')} {new Date(inv.paid_at).toLocaleDateString(t('locale') || 'de-DE')}</span>}
                                            </div>
                                        )}

                                    </div>

                                    {/* Aktionen */}
                                    <div className="p-3 border-t border-primary/10 bg-background/50 space-y-2 mt-auto">
                                        {/* Status-Verwaltung Dropdown */}
                                        {!isReadOnlyDemo && (
                                            <div className="flex items-center justify-between gap-2">
                                                <select 
                                                    value={inv.status} 
                                                    onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                                                    className="flex-1 text-[10px] px-2 py-1.5 rounded-lg bg-white border border-primary/20 font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all capitalize"
                                                    title={t('crm.status_label') || 'Status'}
                                                >
                                                    <option value="Entwurf">{t('crm.status_entwurf')}</option>
                                                    <option value="Offen">{t('crm.status_offen')}</option>
                                                    <option value="Bezahlt">{t('crm.status_bezahlt')}</option>
                                                    <option value="Inkasso">{t('crm.status_inkasso')}</option>
                                                    <option value="Storniert">{t('crm.status_storniert')}</option>
                                                </select>
                                                <button onClick={() => handleCopyPaymentLandingPageLink(inv.id)} title={t('crm.copy_landing_page')} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Zahlungsaktionen */}
                                        {!isReadOnlyDemo && inv.doc_type === 'Rechnung' && inv.status !== 'Bezahlt' && inv.status !== 'Storniert' && (
                                            <div className="space-y-1.5">
                                                {inv.stripe_payment_link ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => { navigator.clipboard.writeText(inv.stripe_payment_link); alert(t('crm.paylink_copied')); }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-2 rounded-md bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200 font-bold" title={t('crm.copy_paylink')}>
                                                            <Copy className="w-3 h-3" /> {t('crm.copy_paylink')}
                                                        </button>
                                                        <a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-1 px-2.5 py-2 text-[10px] rounded-md bg-violet-600 text-white hover:bg-violet-700 font-medium" title={t('crm.open_paylink')}>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                        <button onClick={() => handleCreateStripeLink(inv.id)} disabled={creatingPaymentLink === inv.id}
                                                            className="flex items-center justify-center gap-1 px-2.5 py-2 text-[10px] rounded-md bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 font-medium disabled:opacity-50" title={t('crm.new_paylink')}>
                                                            <RefreshCw className={`w-3 h-3 ${creatingPaymentLink === inv.id ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleCreateStripeLink(inv.id)} disabled={creatingPaymentLink === inv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 font-bold shadow-sm disabled:opacity-50 transition-all" title={t('crm.create_stripe_paylink')}>
                                                            <CreditCard className="w-3.5 h-3.5" /> {creatingPaymentLink === inv.id ? t('crm.creating') : '💳 ' + t('crm.create_stripe_paylink')}
                                                        </button>
                                                        <button onClick={() => handleSetVorkasse(inv.id)}
                                                            className="flex items-center justify-center gap-1.5 text-[10px] px-3 py-2 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium" title={t('crm.set_prepay')}>
                                                            <Banknote className="w-3 h-3" /> {t('crm.prepay')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* PDF, E-Mail & {t('crm.share')} */}
                                        <div className="grid grid-cols-5 gap-2">
                                            <button onClick={() => handleDownloadPDF(inv)} className="btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs" title={t('crm.download_pdf')}>
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </button>
                                            
                                            <button onClick={() => handleSendEmail(inv.id)} disabled={sendingEmail === inv.id} 
                                                className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50" title={t('crm.send_email')}>
                                                <Mail className={`w-3.5 h-3.5 ${sendingEmail === inv.id ? 'animate-pulse' : ''}`} /> Mail
                                            </button>

                                            <button onClick={() => handleShare(inv)} className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors" title="WhatsApp">
                                                <Send className="w-3.5 h-3.5" /> WA
                                            </button>
                                            
                                            {!isReadOnlyDemo && (
                                                <button onClick={() => handleEditInvoice(inv)} className="btn-secondary flex items-center justify-center py-2 text-xs" title={t('action.edit')}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {!isReadOnlyDemo && (
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="flex items-center justify-center py-2 text-xs rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors" title={t('crm.delete')}>
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
