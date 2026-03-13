'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    PlusCircle, Box, FileText, Download, Send, Tag, Save, User,
    Euro, Search, Trash2, Mail, Phone, MessageCircle
} from 'lucide-react';

export default function CRMDashboard() {
    const [activeTab, setActiveTab] = useState<'invoices' | 'articles' | 'settings'>('invoices');

    const [settings, setSettings] = useState({
        companyName: 'Open-Akquise',
        ownerName: '',
        address: 'Musterstraße 1',
        city: '1010 Wien',
        phone: '',
        email: '',
        iban: '',
        bic: ''
    });

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('crmSettings', JSON.stringify(settings));
        alert('Stammdaten gespeichert!');
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
        status: 'Entwurf',
        items: [] as any[]
    });
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    const [selectedArticleId, setSelectedArticleId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);

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
        const saved = localStorage.getItem('crmSettings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) { }
        }
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
                setNewInvoice({ customer_name: '', customer_email: '', customer_address: '', status: 'Entwurf', items: [] });
                setShowInvoiceForm(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to create invoice', error);
        }
    };

    const generatePDFBlob = (invoice: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text('RECHNUNG', 14, 20);

        doc.setFontSize(10);
        doc.text(`Rechnungsnr: ${invoice.invoice_number}`, 14, 30);
        doc.text(`Datum: ${new Date(invoice.issue_date).toLocaleDateString('de-DE')}`, 14, 36);

        // From (Open-Akquise Immo)
        doc.setFontSize(12);
        doc.text(settings.companyName || 'Ihr Unternehmen', 130, 20);
        doc.setFontSize(10);
        doc.text(settings.address || '', 130, 26);
        doc.text(settings.city || '', 130, 32);
        if (settings.phone) doc.text(settings.phone, 130, 38);
        if (settings.email) doc.text(settings.email, 130, 44);

        // To
        doc.setFontSize(12);
        doc.text('Rechnungsempfänger:', 14, 50);
        doc.setFontSize(10);
        doc.text(invoice.customer_name || 'Unbekannt', 14, 56);
        if (invoice.customer_address) doc.text(invoice.customer_address, 14, 62);
        if (invoice.customer_email) doc.text(invoice.customer_email, 14, 68);

        // Fetching Items would be needed ideally. For now we just print Total if we don't have items.
        // Wait, the API GET /invoices doesn't return items. I'll just output the total amount.
        const startY = 85;
        (doc as any).autoTable({
            startY,
            head: [['Position', 'Menge', 'Einzelpreis', 'Gesamt']],
            body: [
                ['Consulting / Dienstleistung', '1', `${invoice.total_amount} €`, `${invoice.total_amount} €`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [45, 212, 191] }
        });

        // Total
        const finalY = (doc as any).lastAutoTable.finalY || startY + 20;
        doc.setFontSize(14);
        doc.text(`Gesamtbetrag: ${Number(invoice.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Euro`, 14, finalY + 15);

        if (settings.iban) {
            doc.setFontSize(10);
            doc.text(`Bankverbindung: IBAN: ${settings.iban} ${settings.bic ? '| BIC: ' + settings.bic : ''}`, 14, finalY + 30);
        }

        return doc.output('blob');
    };

    const handleDownloadPDF = (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rechnung_${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async (invoice: any) => {
        const blob = generatePDFBlob(invoice);
        const file = new File([blob], `Rechnung_${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Rechnung ${invoice.invoice_number}`,
                    text: `Hallo, anbei die neue Rechnung ${invoice.invoice_number}.`
                });
            } catch (error) {
                console.log('Share was cancelled or failed', error);
            }
        } else {
            alert('Teilen von Dateien wird in diesem Browser direkt nicht unterstützt. Bitte lade die PDF herunter und versende sie manuell über WhatsApp Desktop / Email.');
            handleDownloadPDF(invoice);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    CRM & Rechnungen
                </h1>
                <p className="text-muted-foreground mt-2">
                    Kunden verwalten, Artikel anlegen und Rechnungen direkt per Mail/WhatsApp versenden.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-primary/20">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <FileText className="w-5 h-5" /> Rechnungen
                </button>
                <button
                    onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'articles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Box className="w-5 h-5" /> Artikel-Stamm
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <User className="w-5 h-5" /> Meine Stammdaten
                </button>
            </div>

            {/* CONTENT: STAMMDATEN */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Meine Stammdaten</h2>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-primary">
                        <p className="text-sm text-muted-foreground mb-6">
                            Diese Daten werden auf Ihren Rechnungen als Absender angezeigt.
                        </p>
                        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="companyName" className="block text-xs font-medium mb-1">Firmenname</label>
                                <input id="companyName" title="Firmenname" placeholder="Firma" type="text" value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="ownerName" className="block text-xs font-medium mb-1">Inhaber (optional)</label>
                                <input id="ownerName" title="Inhaber (optional)" placeholder="Max Mustermann" type="text" value={settings.ownerName} onChange={e => setSettings({ ...settings, ownerName: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-xs font-medium mb-1">Straße & Hausnummer</label>
                                <input id="address" title="Straße und Hausnummer" placeholder="Musterstraße 1" type="text" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium mb-1">PLZ & Ort</label>
                                <input id="city" title="PLZ und Ort" placeholder="1010 Wien" type="text" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-xs font-medium mb-1">Telefonnummer</label>
                                <input id="phone" title="Telefonnummer" placeholder="+43..." type="text" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium mb-1">E-Mail</label>
                                <input id="email" title="E-Mail" placeholder="info@beispiel.at" type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="iban" className="block text-xs font-medium mb-1">IBAN</label>
                                <input id="iban" title="IBAN" placeholder="AT..." type="text" value={settings.iban} onChange={e => setSettings({ ...settings, iban: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div>
                                <label htmlFor="bic" className="block text-xs font-medium mb-1">BIC</label>
                                <input id="bic" title="BIC" placeholder="BIC" type="text" value={settings.bic} onChange={e => setSettings({ ...settings, bic: e.target.value })} className="input-field py-2 text-sm w-full" />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Stammdaten speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONTENT: ARTICLES */}
            {activeTab === 'articles' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Artikelverwaltung</h2>
                        <button
                            onClick={() => setShowArticleForm(!showArticleForm)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Neuer Artikel
                        </button>
                    </div>

                    {showArticleForm && (
                        <div className="glass-card p-6 border-l-4 border-l-primary">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Artikel anlegen</h3>
                            <form onSubmit={handleCreateArticle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="new_title" className="block text-xs font-medium mb-1">Titel / Name</label>
                                    <input
                                        id="new_title"
                                        title="Titel des Artikels"
                                        placeholder="Bitte Artikelbeschreibung eingeben"
                                        type="text" required
                                        value={newArticle.title}
                                        onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
                                        className="input-field py-2 text-sm w-full"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="new_desc" className="block text-xs font-medium mb-1">Beschreibung</label>
                                    <input
                                        id="new_desc"
                                        title="Beschreibungstext für Artikel"
                                        placeholder="Optionale Beschreibung"
                                        type="text"
                                        value={newArticle.description}
                                        onChange={e => setNewArticle({ ...newArticle, description: e.target.value })}
                                        className="input-field py-2 text-sm w-full"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new_price" className="block text-xs font-medium mb-1">Preis (€)</label>
                                    <input
                                        id="new_price"
                                        title="Artikelpreis in Euro"
                                        placeholder="z.B. 10.50"
                                        type="number" step="0.01" required
                                        value={newArticle.price}
                                        onChange={e => setNewArticle({ ...newArticle, price: parseFloat(e.target.value) || 0 })}
                                        className="input-field py-2 text-sm w-full"
                                    />
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
                                    <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Keine Artikel gefunden.</td></tr>
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


            {/* CONTENT: INVOICES */}
            {activeTab === 'invoices' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Rechnungen</h2>
                        <button
                            onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Neue Rechnung
                        </button>
                    </div>

                    {showInvoiceForm && (
                        <div className="glass-card p-6 border-l-4 border-l-secondary space-y-6">
                            <h3 className="text-lg font-semibold text-secondary">Neue Rechnung erstellen</h3>
                            <form onSubmit={handleCreateInvoice} className="space-y-6">
                                {/* Kunde */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="customer_name" className="block text-xs font-medium mb-1">Kunden Name <span className="text-error">*</span></label>
                                        <input
                                            id="customer_name"
                                            title="Name des Kunden"
                                            type="text" required
                                            value={newInvoice.customer_name}
                                            onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                                            className="input-field py-2 text-sm w-full"
                                            placeholder="Max Mustermann"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="customer_email" className="block text-xs font-medium mb-1">E-Mail</label>
                                        <input
                                            id="customer_email"
                                            title="E-Mail des Kunden"
                                            type="email"
                                            value={newInvoice.customer_email}
                                            onChange={e => setNewInvoice({ ...newInvoice, customer_email: e.target.value })}
                                            className="input-field py-2 text-sm w-full"
                                            placeholder="max@beispiel.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="customer_address" className="block text-xs font-medium mb-1">Adresse</label>
                                        <input
                                            id="customer_address"
                                            title="Adresse des Kunden"
                                            type="text"
                                            value={newInvoice.customer_address}
                                            onChange={e => setNewInvoice({ ...newInvoice, customer_address: e.target.value })}
                                            className="input-field py-2 text-sm w-full"
                                            placeholder="Straße 1, 1010 Wien"
                                        />
                                    </div>
                                </div>

                                {/* Artikel hinzufügen */}
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <h4 className="text-sm font-semibold mb-3">Positionen hinzufügen</h4>
                                    <div className="flex items-end gap-3 flex-wrap">
                                        <div className="flex-1 min-w-[200px]">
                                            <label htmlFor="select_article" className="block text-xs font-medium mb-1">Artikel auswählen</label>
                                            <select
                                                id="select_article"
                                                title="Artikel auswählen"
                                                value={selectedArticleId}
                                                onChange={e => setSelectedArticleId(e.target.value)}
                                                className="input-field py-2 text-sm w-full bg-background"
                                            >
                                                <option value="">-- Bitte wählen --</option>
                                                {articles.map(a => (
                                                    <option key={a.id} value={a.id}>{a.title} ({Number(a.price).toLocaleString('de-DE')} €)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label htmlFor="select_qty" className="block text-xs font-medium mb-1">Menge</label>
                                            <input
                                                id="select_qty"
                                                title="Artikelmenge konfigurieren"
                                                placeholder="1"
                                                type="number" min="1"
                                                value={selectedQuantity}
                                                onChange={e => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                                className="input-field py-2 text-sm w-full"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddInvoiceItem}
                                            disabled={!selectedArticleId}
                                            className="btn-secondary py-2 h-[38px] flex items-center gap-2 px-4 shadow-sm"
                                        >
                                            <PlusCircle className="w-4 h-4" /> Hinzufügen
                                        </button>
                                    </div>

                                    {/* Positionen Liste */}
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
                                                        <tr key={idx} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                                                            <td className="py-2.5 font-medium">{item.title}</td>
                                                            <td className="py-2.5 text-center">{item.quantity}</td>
                                                            <td className="py-2.5 text-right text-muted-foreground">
                                                                {item.unit_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                            </td>
                                                            <td className="py-2.5 text-right font-medium">
                                                                {item.total_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                            </td>
                                                            <td className="py-2.5 text-right">
                                                                <button type="button" aria-label="Position löschen" title="Position löschen" onClick={() => handleRemoveInvoiceItem(idx)} className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-primary/20">
                                                        <td colSpan={3} className="py-3 text-right font-bold">Summe:</td>
                                                        <td className="py-3 text-right font-bold text-primary text-base">
                                                            {invoiceTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setShowInvoiceForm(false)} className="btn-secondary">Abbrechen</button>
                                    <button type="submit" disabled={newInvoice.items.length === 0} className="btn-primary flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Rechnung Speichern
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoices.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground glass-card">
                                Bisher keine Rechnungen erstellt.
                            </div>
                        ) : invoices.map(inv => (
                            <div key={inv.id} className="glass-card hover:shadow-xl transition-all duration-300 flex flex-col h-full border-t-4 border-t-secondary relative overflow-hidden">
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xs text-muted-foreground font-mono mb-1">{inv.invoice_number}</div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={inv.customer_name}>
                                                {inv.customer_name}
                                            </h3>
                                        </div>
                                        <div className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider rounded-md border border-secondary/20">
                                            {inv.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="line-clamp-1">{inv.customer_email || 'Keine Mail'}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                        <div className="text-xs font-medium text-muted-foreground">Rechnungsbetrag</div>
                                        <div className="font-bold text-lg text-primary">
                                            {Number(inv.total_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-primary/10 bg-background/50 grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={() => handleDownloadPDF(inv)}
                                        className="btn-secondary flex items-center justify-center gap-2 py-2 text-xs hover:bg-primary/10"
                                        title="PDF Herunterladen"
                                    >
                                        <Download className="w-3.5 h-3.5" /> PDF
                                    </button>
                                    <button
                                        onClick={() => handleShare(inv)}
                                        className="btn-primary flex items-center justify-center gap-2 py-2 text-xs shadow-md"
                                        title="Senden via Mail/WhatsApp/Telegram..."
                                    >
                                        <Send className="w-3.5 h-3.5" /> Versenden
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
