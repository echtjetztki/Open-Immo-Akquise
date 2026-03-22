'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Property, PropertyStatus, PropertyType } from '@/lib/types';
import { X, Save, Loader2, MessageCircle, ExternalLink, Trash2, History, Clock } from 'lucide-react';

interface PropertyModalProps {
    property: Property;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isAdmin?: boolean;
    isReadOnly?: boolean;
}

export function PropertyModal({ property, isOpen, onClose, onSave, isAdmin = false, isReadOnly = false }: PropertyModalProps) {
    const [formData, setFormData] = useState({
        ...property,
        title: property.title || '',
        external_id: property.external_id || '',
        kaufpreis: property.kaufpreis?.toString() || '',
        uebergeben_am: property.uebergeben_am || new Date().toISOString().split('T')[0],
        email: property.email || '',
        telefonnummer: property.telefonnummer || '',
        objekttyp: property.objekttyp || 'Kauf',
        plz: property.plz || '',
        ort: property.ort || '',
        betreut_von: property.betreut_von || '☹️',
        provision_abgeber_custom: property.provision_abgeber_custom || '',
        provision_kaeufer_custom: property.provision_kaeufer_custom || '',
        notizfeld: property.notizfeld || ''
    });
    const [saving, setSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fetchProperty, setFetchProperty] = useState<Property>(property);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    // Fetch full details (including history) when modal opens
    useEffect(() => {
        if (isOpen && property.id) {
            const fetchFullDetails = async () => {
                setLoadingDetails(true);
                try {
                    const res = await fetch(`/api/properties/${property.id}`);
                    if (res.ok) {
                        const fullData = await res.json();
                        setFetchProperty(fullData);
                    }
                } catch (err) {
                    console.error('Failed to fetch property details:', err);
                } finally {
                    setLoadingDetails(false);
                }
            };
            fetchFullDetails();
        }
    }, [isOpen, property.id]);

    const handleDelete = async () => {
        if (isReadOnly) {
            return;
        }
        if (!confirm('Möchtest du diese Immobilie wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }

        setError('');
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/properties/${property.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Fehler beim Löschen der Immobilie');
            }

            onSave(); // Refresh list via complete callback
            onClose(); // Close modal
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten');
        } finally {
            setIsDeleting(false);
        }
    };

    // Update form data when property changes
    useEffect(() => {
        if (property && isOpen) {
            setFormData({
                ...property,
                title: property.title || '',
                external_id: property.external_id || '',
                kaufpreis: property.kaufpreis?.toString() || '',
                uebergeben_am: property.uebergeben_am || new Date().toISOString().split('T')[0],
                email: property.email || '',
                telefonnummer: property.telefonnummer || '',
                objekttyp: property.objekttyp || 'Kauf',
                plz: property.plz || '',
                ort: property.ort || '',
                betreut_von: property.betreut_von || '☹️',
                provision_abgeber_custom: property.provision_abgeber_custom || '',
                provision_kaeufer_custom: property.provision_kaeufer_custom || '',
                notizfeld: property.notizfeld || ''
            });
            setFetchProperty(property);
        }
    }, [property, isOpen]);

    if (!isOpen) return null;
    // Calculate automatic values
    const kaufpreisNum = parseFloat(formData.kaufpreis) || 0;
    const gesamtprovision = kaufpreisNum * 0.06;
    const provision_abgeber = kaufpreisNum * 0.03;
    const provision_kaeufer = kaufpreisNum * 0.03;
    const berechnung = gesamtprovision * 0.1;

    // Helper for external_source ID extraction
    const extractexternal_sourceId = (url: string) => {
        try {
            const match = url.match(/(\d+)\/?$/);
            if (match && match[1]) {
                setFormData(prev => ({ ...prev, external_id: match[1] }));
            }
        } catch (e) {
            // Ignore
        }
    };

    // Helper for WhatsApp Link
    const getWhatsAppLink = (phone: string) => {
        if (!phone) return '#';
        let clean = phone.replace(/[^\d+]/g, '');
        if (clean.startsWith('+')) clean = clean.substring(1);
        else if (clean.startsWith('0')) clean = '43' + clean.substring(1);
        return `https://wa.me/${clean}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) {
            return;
        }

        setError('');
        setSaving(true);

        try {
            const response = await fetch(`/api/properties/${property.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Fehler beim Speichern');
            }

            // Success
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Optional: Pre-scroll fix just in case mobile keyboards act up
        if (isOpen) {
            window.scrollTo({ top: window.scrollY, behavior: 'instant' });
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-2 sm:p-4 animate-fade-in backdrop-blur-sm bg-black/40 overflow-hidden touch-none safe-area-modal-overlay">
            {/* Dark overlay to catch clicks */}
            <div className="fixed inset-0 bg-black/20" onClick={onClose} />

            <div
                className="w-full max-w-4xl bg-background rounded-2xl border border-primary/20 shadow-2xl relative z-10 transition-all duration-200 flex flex-col max-h-[92dvh] my-auto overflow-hidden ring-1 ring-black/5"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-primary/10 flex-shrink-0 bg-background/95 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary truncate">
                            Immobilie bearbeiten
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded">ID: {property.id}</span>
                            <span className="text-[10px] text-muted-foreground/60">•</span>
                            <span className="text-[10px] font-medium text-muted-foreground">Erstellt: {new Date(property.created_at).toLocaleDateString('de-AT')}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all bg-secondary/5 text-foreground/70 active:scale-95 shrink-0"
                        title="Schließen"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="p-4 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                                {error}
                            </div>
                        )}

                        {/* Top Row: Link & Veröffentlicht */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <label htmlFor="property_link" className="block text-xs font-medium mb-1.5 ml-1">
                                    Link zur Immobilie *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="property_link"
                                        title="Link zur Immobilie"
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => {
                                            setFormData({ ...formData, link: e.target.value });
                                            extractexternal_sourceId(e.target.value);
                                        }}
                                        className={`input-field flex-1 py-2 text-sm ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                        required
                                        placeholder="https://..."
                                        disabled={!isAdmin}
                                    />
                                    {formData.link && (
                                        <a
                                            href={formData.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center shadow-sm"
                                            title="Anzeige öffnen"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="uebergeben_am" className="block text-xs font-medium mb-1.5 ml-1">Veröffentlicht am:</label>
                                <input
                                    id="uebergeben_am"
                                    type="date"
                                    value={formData.uebergeben_am ? new Date(formData.uebergeben_am).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, uebergeben_am: e.target.value })}
                                    className={`input-field w-full py-2 text-sm ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    required
                                    disabled={!isAdmin}
                                />
                            </div>
                        </div>

                        {/* Title Row (Full Width) */}
                        <div>
                            <label htmlFor="title" className="block text-xs font-medium mb-1.5 ml-1">
                                Titel der Anzeige
                            </label>
                            <input
                                id="title"
                                title="Titel der Anzeige"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={`input-field w-full py-2.5 text-base font-semibold ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="z.B. Schöne 3-Zimmer Wohnung"
                                disabled={!isAdmin}
                            />
                        </div>

                        {/* ID & Provision Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="external_id" className="block text-xs font-medium mb-1.5 ml-1">
                                    external_source ID
                                </label>
                                <input
                                    id="external_id"
                                    title="external_source ID"
                                    type="text"
                                    value={formData.external_id}
                                    onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                                    className={`input-field w-full py-2 text-sm ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="123456789"
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="provision_abgeber_custom" className="block text-xs font-medium mb-1.5 ml-1">
                                    Abgeber Prov. (%)
                                </label>
                                <input
                                    id="provision_abgeber_custom"
                                    title="Abgeber Provision"
                                    type="text"
                                    value={formData.provision_abgeber_custom}
                                    onChange={(e) => setFormData({ ...formData, provision_abgeber_custom: e.target.value })}
                                    className="input-field w-full py-2 text-sm"
                                    placeholder="z.B. 3%"
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="provision_kaeufer_custom" className="block text-xs font-medium mb-1.5 ml-1">
                                    Käufer Prov. (%)
                                </label>
                                <input
                                    id="provision_kaeufer_custom"
                                    title="Käufer Provision"
                                    type="text"
                                    value={formData.provision_kaeufer_custom}
                                    onChange={(e) => setFormData({ ...formData, provision_kaeufer_custom: e.target.value })}
                                    className="input-field w-full py-2 text-sm"
                                    placeholder="z.B. 3%"
                                    disabled={!isAdmin}
                                />
                            </div>
                        </div>

                        {/* Location & Type Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="sm:col-span-1">
                                <label htmlFor="plz" className="block text-xs font-medium mb-1.5 ml-1">PLZ</label>
                                <input
                                    id="plz"
                                    title="Postleitzahl"
                                    type="text"
                                    value={formData.plz}
                                    onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                                    className={`input-field w-full py-2 text-sm ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="1010"
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="ort" className="block text-xs font-medium mb-1.5 ml-1">Ort</label>
                                <input
                                    id="ort"
                                    title="Ort"
                                    type="text"
                                    value={formData.ort}
                                    onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                                    className={`input-field w-full py-2 text-sm ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Wien"
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <label htmlFor="objekttyp" className="block text-xs font-medium mb-1.5 ml-1">Objekttyp</label>
                                <select
                                    id="objekttyp"
                                    title="Objekttyp auswählen"
                                    value={formData.objekttyp}
                                    onChange={(e) => setFormData({ ...formData, objekttyp: e.target.value as PropertyType })}
                                    className={`input-field w-full py-2 text-sm bg-background ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={!isAdmin}
                                >
                                    <option value="Kauf">Kauf</option>
                                    <option value="Miete">Miete</option>
                                    <option value="Grundstück">Grundstück</option>
                                    <option value="Gewerblich">Gewerblich</option>
                                </select>
                            </div>
                        </div>

                        {/* Status & Price Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <div>
                                <label htmlFor="kaufpreis" className="block text-xs font-medium mb-1.5 ml-1">Kaufpreis (€) *</label>
                                <input
                                    id="kaufpreis"
                                    title="Kaufpreis in Euro"
                                    placeholder="z.B. 250000"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.kaufpreis}
                                    onChange={(e) => setFormData({ ...formData, kaufpreis: e.target.value })}
                                    className={`input-field py-2 text-sm font-bold text-primary ${!isAdmin ? 'bg-muted/30 opacity-70 cursor-not-allowed' : ''}`}
                                    required
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-xs font-medium mb-1.5 ml-1">Status *</label>
                                <select
                                    id="status"
                                    title="Status ändern"
                                    value={formData.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value as PropertyStatus;
                                        setFormData(prev => ({
                                            ...prev,
                                            status: newStatus,
                                            uebergeben_am: newStatus === 'Aufgenommen' ? new Date().toISOString().split('T')[0] : prev.uebergeben_am
                                        }));
                                    }}
                                    className="input-field py-2 text-sm"
                                    required
                                >
                                    <option value="NEU">🤖 NEU</option>
                                    <option value="Zu vergeben">👍 Zu vergeben</option>
                                    <option value="Von GP kontaktiert">📞 Von GP kontaktiert</option>
                                    <option value="Aufgenommen">📋 Aufgenommen</option>
                                    <option value="Vermarktung">📣 Vermarktung</option>
                                    <option value="Abschluss/Verkauf">✅ Abschluss/Verkauf</option>
                                    <option value="Follow-up">🔄 Follow-up</option>
                                    <option value="Storniert">❌ Storniert</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="betreut_von" className="block text-xs font-medium mb-1.5 ml-1">Betreut von:</label>
                                <select
                                    id="betreut_von"
                                    title="Betreuer auswählen"
                                    value={formData.betreut_von}
                                    onChange={(e) => setFormData({ ...formData, betreut_von: e.target.value })}
                                    className="input-field py-2 text-sm bg-background"
                                >
                                    <option value="☹️">☹️ -</option>
                                    <option value="Fabian">🧥 Fabian</option>
                                    <option value="Markus">👔 Markus</option>
                                    <option value="Ahmed">🧔 Ahmed</option>
                                    <option value="Kaloyan">🕶️ Kaloyan</option>
                                    <option value="Viktoria">👗 Viktoria</option>
                                    <option value="Melinda">👒 Melinda</option>
                                </select>
                            </div>
                        </div>

                        {/* Contact Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium mb-1.5 ml-1">E-Mail</label>
                                <input
                                    id="email"
                                    title="E-Mail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field py-2 text-sm"
                                    placeholder="@"
                                />
                            </div>
                            <div>
                                <label htmlFor="telefonnummer" className="block text-xs font-medium mb-1.5 ml-1">Telefon</label>
                                <div className="flex gap-2">
                                    <input
                                        id="telefonnummer"
                                        title="Telefonnummer"
                                        type="tel"
                                        value={formData.telefonnummer}
                                        onChange={(e) => setFormData({ ...formData, telefonnummer: e.target.value })}
                                        className="input-field py-2 text-sm flex-1"
                                        placeholder="+43..."
                                    />
                                    {formData.telefonnummer && (
                                        <a
                                            href={getWhatsAppLink(formData.telefonnummer)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
                                            title="WhatsApp Nachricht senden"
                                            aria-label="WhatsApp Nachricht senden"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Admin Calculations */}
                        {isAdmin && (
                            <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Gesamt (6%)</div>
                                        <div className="text-sm font-bold text-foreground">
                                            {gesamtprovision.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Abgeber (3%)</div>
                                        <div className="text-sm font-semibold text-muted-foreground">
                                            {provision_abgeber.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Käufer (3%)</div>
                                        <div className="text-sm font-semibold text-muted-foreground">
                                            {provision_kaeufer.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider text-secondary">Verdienst (10%)</div>
                                        <div className="text-sm font-bold text-secondary">
                                            {berechnung.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label htmlFor="notizfeld" className="block text-xs font-medium mb-1.5 ml-1">Notizen</label>
                            <textarea
                                id="notizfeld"
                                title="Notizen"
                                value={formData.notizfeld}
                                onChange={(e) => setFormData({ ...formData, notizfeld: e.target.value })}
                                className="input-field w-full min-h-[80px] py-2 text-sm resize-y mb-2"
                                placeholder="..."
                            />
                        </div>

                        {/* External Reports History */}
                        <div className="space-y-3 pt-4 border-t border-primary/10">
                            <label className="block text-xs font-bold mb-2 ml-1 text-primary uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4" />
                                <span>Aktivitäten & Berichte (Status-Updates):</span>
                                {(fetchProperty.reports && fetchProperty.reports.length > 0) && (
                                    <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-black ml-auto">
                                        {fetchProperty.reports.length} Einträge
                                    </span>
                                )}
                            </label>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingDetails ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                                    </div>
                                ) : (fetchProperty.reports && fetchProperty.reports.length > 0) ? (
                                    fetchProperty.reports.map((report, idx) => (
                                        <div key={report.id || idx} className="p-4 rounded-2xl bg-white border border-primary/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="px-2.5 py-1 bg-primary text-white rounded-lg font-black text-[9px] uppercase tracking-tighter shadow-sm">
                                                    {report.status}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(report.created_at).toLocaleString('de-AT')}
                                                </div>
                                            </div>
                                            {report.note && (
                                                <p className="text-sm text-foreground/80 font-medium leading-relaxed mb-3">
                                                    {report.note}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success/40" />
                                                <span className="text-[8px] text-muted-foreground/60 font-mono tracking-tighter uppercase">
                                                    Protokolliert von IP: {report.ip_address}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                                        <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest italic">
                                            Noch keine Berichte eingegangen
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Replies History */}
                        <div className="space-y-2 pt-4 border-t border-primary/5">
                            <label className="block text-xs font-bold mb-1.5 ml-1 text-primary/60 uppercase tracking-widest flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 opacity-50" />
                                    <span>KUNDEN-Interaktionen:</span>
                                </div>
                                {property.replies && property.replies.length > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full font-bold">
                                        {property.replies.length}
                                    </span>
                                )}
                            </label>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingDetails ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary/20" />
                                    </div>
                                ) : (fetchProperty.replies && fetchProperty.replies.length > 0) ? (
                                    fetchProperty.replies.map((reply, idx) => (
                                        <div key={reply.id || idx} className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm italic text-foreground/70">
                                            <div className="flex justify-between items-center mb-1 text-[9px] text-muted-foreground/50 uppercase font-black tracking-tighter">
                                                <span>Nachricht #{fetchProperty.replies!.length - idx}</span>
                                                <span>{new Date(reply.created_at).toLocaleString('de-AT')}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{reply.reply_message}</p>
                                        </div>
                                    ))
                                ) : fetchProperty.reply_message ? (
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm italic text-foreground/70 whitespace-pre-wrap">
                                        {fetchProperty.reply_message}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-gray-50/50 border border-dashed border-gray-200 text-center">
                                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                                            Keine Interaktionen
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions (Sticky Bottom) */}
                <div className="p-4 md:p-6 border-t border-primary/10 bg-background/95 backdrop-blur-md flex flex-col sm:flex-row gap-3 flex-shrink-0 sticky bottom-0 z-20 safe-area-modal-footer">
                    {isReadOnly && (
                        <div className="w-full rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-medium text-muted-foreground">
                            Demo-Modus: Bearbeiten und Loeschen sind deaktiviert.
                        </div>
                    )}
                    <div className="flex gap-3 w-full">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-3 rounded-xl flex items-center justify-center text-red-500 border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                                disabled={isReadOnly || saving || isDeleting}
                                title="Immobilie löschen"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1 py-3 text-sm font-bold shadow-sm"
                            disabled={saving || isDeleting}
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="btn-primary flex-[2] flex items-center justify-center gap-2 py-3 text-sm font-black shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                            disabled={isReadOnly || saving || isDeleting}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Speichert...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Änderungen speichern
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default PropertyModal;
