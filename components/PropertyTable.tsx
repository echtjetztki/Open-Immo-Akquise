'use client';

import { useState, useEffect, useMemo } from 'react';
import { Property, PropertyStatus, PropertyNote } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PropertyModal } from './PropertyModal';
import { useLanguage } from '@/lib/language-context';
import { ExternalLink, Edit2, Trash2, MessageSquarePlus, Phone, MessageCircle, Filter, X, ClipboardCopy, Search, Loader2, Send, Save } from 'lucide-react';

interface PropertyTableProps {
    properties: Property[];
    onRefresh: () => void;
    showDelete?: boolean;
    isAdmin?: boolean;
    isAgentView?: boolean;
    isReadOnly?: boolean;
}

const getBetreuerIcon = (name: string) => {
    const icons: Record<string, string> = {
        '☹️': '☹️',
        'Fabian': '🧥',
        'Markus': '👔',
        'Ahmed': '🧔',
        'Kaloyan': '🕶️',
        'Viktoria': '👗',
        'Melinda': '👒'
    };
    return icons[name] || '☹️';
};

export function PropertyTable({
    properties,
    onRefresh,
    showDelete = true,
    isAdmin = false,
    isAgentView = false,
    isReadOnly = false
}: PropertyTableProps) {
    const { t } = useLanguage();
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [notes, setNotes] = useState<Record<number, PropertyNote[]>>({});
    const [loadingNotes, setLoadingNotes] = useState<Record<number, boolean>>({});
    const [addingNoteId, setAddingNoteId] = useState<number | null>(null);
    const [newNoteContent, setNewNoteContent] = useState<string>('');

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterStandort, setFilterStandort] = useState<string>('');
    const [filterVeroeffentlicht, setFilterVeroeffentlicht] = useState<string>('');
    const [filterBetreuer, setFilterBetreuer] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const showBetreuerColumn = !isAgentView;
    const canEdit = !isReadOnly;
    const canDelete = !isReadOnly && showDelete;
    const canChangeStatus = !isReadOnly;

    // Derive unique filter options from properties
    const filterOptions = useMemo(() => {
        const statuses = [...new Set(properties.map(p => p.status))].sort();
        const standorte = [...new Set(
            properties
                .filter(p => p.plz && p.ort)
                .map(p => `${p.plz} ${p.ort}`)
        )].sort();
        const veroeffentlicht = [...new Set(
            properties
                .filter(p => p.uebergeben_am)
                .map(p => {
                    const d = new Date(p.uebergeben_am);
                    return `${d.getMonth() + 1}/${d.getFullYear()}`;
                })
        )].sort((a, b) => {
            const [mA, yA] = a.split('/').map(Number);
            const [mB, yB] = b.split('/').map(Number);
            return yB - yA || mB - mA;
        });
        const betreuer = [...new Set(
            properties
                .filter(p => p.betreut_von)
                .map(p => p.betreut_von as string)
        )].sort();
        return { statuses, standorte, veroeffentlicht, betreuer };
    }, [properties]);

    // Apply filters
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // Text Search
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchesSearch =
                    (p.title?.toLowerCase() || '').includes(searchLower) ||
                    (p.external_id?.toLowerCase() || '').includes(searchLower) ||
                    (p.notizfeld?.toLowerCase() || '').includes(searchLower) ||
                    (p.status?.toLowerCase() || '').includes(searchLower) ||
                    (p.ort?.toLowerCase() || '').includes(searchLower) ||
                    (p.plz?.toLowerCase() || '').includes(searchLower) ||
                    ([p.plz, p.ort].filter(Boolean).join(' ').toLowerCase()).includes(searchLower) ||
                    (p.betreut_von?.toLowerCase() || '').includes(searchLower) ||
                    (p.reply_message?.toLowerCase() || '').includes(searchLower);

                if (!matchesSearch) return false;
            }

            // Filters
            if (filterStatus && p.status !== filterStatus) return false;
            if (filterStandort) {
                const standort = p.plz && p.ort ? `${p.plz} ${p.ort}` : '';
                if (standort !== filterStandort) return false;
            }
            if (filterVeroeffentlicht && p.uebergeben_am) {
                const d = new Date(p.uebergeben_am);
                const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
                if (key !== filterVeroeffentlicht) return false;
            } else if (filterVeroeffentlicht && !p.uebergeben_am) {
                return false;
            }
            if (!isAgentView && filterBetreuer && (p.betreut_von || '') !== filterBetreuer) return false;
            return true;
        });
    }, [properties, filterStatus, filterStandort, filterVeroeffentlicht, filterBetreuer, searchQuery, isAgentView]);

    const activeFilterCount = [
        filterStatus,
        filterStandort,
        filterVeroeffentlicht,
        showBetreuerColumn ? filterBetreuer : ''
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setFilterStatus('');
        setFilterStandort('');
        setFilterVeroeffentlicht('');
        setFilterBetreuer('');
        setSearchQuery('');
    };

    const handleStatusChange = async (id: number, newStatus: PropertyStatus) => {
        if (!canChangeStatus) {
            return;
        }

        setUpdatingStatus(id);
        try {
            const response = await fetch(`/api/properties/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            onRefresh();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(t('table.status_error'));
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            return;
        }
        if (!confirm(t('table.delete_confirm'))) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await fetch(`/api/properties/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete property');
            }

            onRefresh();
        } catch (error) {
            console.error('Failed to delete property:', error);
            alert(t('property.delete_error'));
        } finally {
            setDeletingId(null);
        }
    };

    const fetchNotes = async (propertyId: number) => {
        setLoadingNotes(prev => ({ ...prev, [propertyId]: true }));
        try {
            const response = await fetch(`/api/properties/${propertyId}/notes`);
            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }
            const data = await response.json();
            setNotes(prev => ({ ...prev, [propertyId]: data }));
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoadingNotes(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    const handleAddNote = async (propertyId: number) => {
        if (isReadOnly) {
            return;
        }
        if (!newNoteContent.trim()) {
            alert(t('table.note_empty'));
            return;
        }

        try {
            const response = await fetch(`/api/properties/${propertyId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note_text: newNoteContent,
                    created_by: 'user'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add note');
            }

            setNewNoteContent('');
            setAddingNoteId(null);
            fetchNotes(propertyId);
        } catch (error) {
            console.error('Failed to add note:', error);
            alert(t('table.note_add_error'));
        }
    };

    if (properties.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    {t('table.no_properties')}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                    {t('table.create_first')}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Filter Bar */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showFilters || activeFilterCount > 0
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-primary/5 text-muted-foreground border border-primary/10 hover:bg-primary/10 hover:text-primary'
                            }`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        {t('action.filter')}
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            {t('table.clear_filters')}
                        </button>
                    )}

                    {/* Search Field */}
                    <div className="relative flex-1 ml-2 min-w-[220px]">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                            <Search className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('action.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full !pl-11 !pr-9 !py-2 !text-sm border border-primary/20 rounded-xl bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium placeholder:text-muted-foreground/45"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                title={t('table.clear_search')}
                                aria-label={t('table.clear_search')}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
                        {filteredProperties.length} {t('table.of')} {properties.length} {properties.length === 1 ? t('dashboard.entry') : t('dashboard.entries')}
                    </span>
                </div>

                {showFilters && (
                    <div className={`grid grid-cols-2 ${showBetreuerColumn ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in`}>
                        {/* Status Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('property.status')}</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                title={t('table.filter_status')}
                                className="text-xs px-2 py-1.5 rounded-lg border border-primary/20 bg-background hover:border-primary/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">{t('table.all_statuses')}</option>
                                {filterOptions.statuses.map(s => (
                                    <option key={s} value={s}>{t('status.' + s)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Standort Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.location')}</label>
                            <select
                                value={filterStandort}
                                onChange={(e) => setFilterStandort(e.target.value)}
                                title={t('table.filter_location')}
                                className="text-xs px-2 py-1.5 rounded-lg border border-primary/20 bg-background hover:border-primary/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">{t('table.all_locations')}</option>
                                {filterOptions.standorte.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Veröffentlicht Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.published')}</label>
                            <select
                                value={filterVeroeffentlicht}
                                onChange={(e) => setFilterVeroeffentlicht(e.target.value)}
                                title={t('table.filter_period')}
                                className="text-xs px-2 py-1.5 rounded-lg border border-primary/20 bg-background hover:border-primary/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">{t('table.all_periods')}</option>
                                {filterOptions.veroeffentlicht.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>

                        {showBetreuerColumn && (
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('property.supervised_by')}</label>
                                <select
                                    value={filterBetreuer}
                                    onChange={(e) => setFilterBetreuer(e.target.value)}
                                    title={t('table.filter_agent')}
                                    className="text-xs px-2 py-1.5 rounded-lg border border-primary/20 bg-background hover:border-primary/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">{t('table.all_agents')}</option>
                                    {filterOptions.betreuer.map(b => (
                                        <option key={b} value={b}>{getBetreuerIcon(b)} {b}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin rounded-lg border border-primary/5 bg-white/30">
                <table className="w-full table-fixed border-collapse">
                    <thead>
                        <tr className="border-b border-primary/10 bg-primary/5">
                            <th className="text-left py-2 px-1 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{t('table.property_and_type')}</th>
                            <th className="text-left py-2 px-1 text-[10px] font-black text-muted-foreground w-[160px] uppercase tracking-tighter">{t('table.location')}</th>
                            <th className="text-left py-2 px-1 text-[10px] font-black text-muted-foreground w-[185px] uppercase tracking-tighter">{t('table.status_and_update')}</th>
                            <th className="text-left py-2 px-1 text-[10px] font-black text-muted-foreground w-[130px] uppercase tracking-tighter">{t('table.contact_and_price')}</th>
                            {showBetreuerColumn && (
                                <th className="text-center py-2 px-1 text-[10px] font-black text-muted-foreground w-[90px] uppercase tracking-tighter">{t('table.agent')}</th>
                            )}
                            <th className="text-left py-2 px-1 text-[10px] font-black text-muted-foreground w-[80px] uppercase tracking-tighter">{t('property.date')}</th>
                            <th className="text-center py-2 px-1 text-[10px] font-black text-muted-foreground w-[90px] uppercase tracking-tighter">{t('table.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProperties.map((property) => (
                            <tr
                                key={property.id}
                                className="border-b border-primary/5 hover:bg-white/50 transition-colors"
                            >
                                {/* external_source ID & Typ */}
                                <td className="py-3 px-2">
                                    <div className="flex flex-col gap-1.5 overflow-hidden">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20 shadow-sm uppercase shrink-0">
                                                {t('type.' + (property.objekttyp || 'Kauf'))}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                {property.external_id || 'N/A'}
                                            </span>
                                        </div>
                                        {property.title && (
                                            <div className="font-bold text-foreground text-xs leading-snug whitespace-normal break-words line-clamp-3 max-w-[62ch] hover:text-primary transition-colors cursor-default" title={t(property.title || "")}>
                                                {t(property.title || "")}
                                            </div>
                                        )}
                                        {!isAgentView && (property.plz || property.ort) && (
                                            <div
                                                className="text-[10px] font-semibold text-muted-foreground truncate"
                                                title={[property.plz, t(property.ort || '')].filter(Boolean).join(' ')}
                                            >
                                                {[property.plz, t(property.ort || '')].filter(Boolean).join(' ')}
                                            </div>
                                        )}
                                        {property.link && (
                                            <a
                                                href={property.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-secondary text-[10px] font-medium flex items-center gap-1 w-fit group"
                                            >
                                                <span>{t('table.external_link')}</span>
                                                <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                </td>

                                {/* Haus & Standort */}
                                <td className="py-2 px-1 text-[10px] text-foreground">
                                    {property.plz && property.ort ? (
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-primary/80 leading-none mb-0.5">{property.plz}</span>
                                            <span className="font-bold opacity-80 leading-tight line-clamp-2" title={t(property.ort || '')}>{t(property.ort || '')}</span>
                                        </div>
                                    ) : (
                                        <span className="italic opacity-30 text-[9px]">-</span>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="py-3 px-2">
                                    <div className="flex flex-col gap-1.5">
                                        <StatusBadge status={property.status} />
                                        {updatingStatus === property.id ? (
                                            <div className="flex items-center gap-1.5 bg-primary/5 p-1 rounded-lg">
                                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                                <span className="text-[10px] text-primary font-bold">{t('action.loading')}</span>
                                            </div>
                                        ) : (
                                            <select
                                                value={property.status}
                                                onChange={(e) => handleStatusChange(property.id, e.target.value as PropertyStatus)}
                                                disabled={!canChangeStatus}
                                                className="text-[10px] font-black px-1.5 py-1 rounded-lg border border-primary/10 bg-white/50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer w-[170px] focus:ring-2 focus:ring-primary/10 outline-none shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                                title={t('property.status_change')}
                                            >
                                                <option value="NEU">🤖 {t('status.NEU')}</option>
                                                <option value="Zu vergeben">👍 {t('status.Zu vergeben')}</option>
                                                <option value="Von GP kontaktiert">📞 {t('status.Von GP kontaktiert')}</option>
                                                <option value="Aufgenommen">📋 {t('status.Aufgenommen')}</option>
                                                <option value="Vermarktung">📣 {t('status.Vermarktung')}</option>
                                                <option value="Abschluss/Verkauf">✅ {t('status.Abschluss/Verkauf')}</option>
                                                <option value="Follow-up">🔄 {t('status.Follow-up')}</option>
                                                <option value="Storniert">❌ {t('status.Storniert')}</option>
                                            </select>
                                        )}
                                    </div>
                                </td>

                                {/* Kontakt & Preis */}
                                <td className="py-2 px-1 text-xs">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        {property.telefonnummer ? (
                                            <div className="flex items-center gap-1 group">
                                                <Phone className="w-2.5 h-2.5 text-primary opacity-40 shrink-0" />
                                                <a href={`tel:${property.telefonnummer}`} className="font-black text-[10px] hover:text-primary transition-colors truncate max-w-[90px]">
                                                    {property.telefonnummer}
                                                </a>
                                                <a
                                                    href={`https://wa.me/${property.telefonnummer.replace(/[^\d]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="opacity-0 group-hover:opacity-100 transition-all hover:scale-110 p-0.5"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="w-2.5 h-2.5 text-[#25D366]" />
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] opacity-20 italic">{t('table.no_phone')}</span>
                                        )}
                                        <div className="font-black text-[10px] text-foreground bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 w-fit">
                                            {Number(property.kaufpreis).toLocaleString('de-DE')} €
                                        </div>
                                    </div>
                                </td>

                                {showBetreuerColumn && (
                                <td className="py-2 px-1 text-center align-middle">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm border border-gray-100 shrink-0">
                                            {getBetreuerIcon(property.betreut_von || '☹️')}
                                        </div>
                                        <span className="font-black text-primary/80 text-[10px] uppercase tracking-tight leading-none text-center whitespace-normal break-words max-w-[80px]">
                                            {property.betreut_von && property.betreut_von !== '☹️' ? t(property.betreut_von) : '-'}
                                        </span>
                                    </div>
                                </td>
                                )}

                                <td className="py-3 px-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                    {property.uebergeben_am ? new Date(property.uebergeben_am).toLocaleDateString('de-AT') : '-'}
                                </td>

                                <td className="py-3 px-2">
                                    <div className="flex items-center justify-center gap-1.5">
                                        {property.external_id && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const url = `${window.location.origin}/report?id=${property.external_id}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert(t('property.report_link_copied'));
                                                }}
                                                className="p-2 rounded-xl bg-secondary/5 hover:bg-secondary text-secondary hover:text-white transition-all shadow-sm"
                                                title={t('property.copy_report_link')}
                                            >
                                                <ClipboardCopy className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => setEditingProperty(property)}
                                                className="p-2 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-white transition-all shadow-sm"
                                                title={t('action.edit')}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(property.id)}
                                                disabled={deletingId === property.id}
                                                className="p-2 rounded-xl bg-error/5 hover:bg-error text-error hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-error/5 disabled:hover:text-error"
                                                title={t('action.delete')}
                                            >
                                                {deletingId === property.id ? (
                                                    <span className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Property Cards (Visible only on mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden pb-4">
                {filteredProperties.map((property) => (
                    <div key={property.id} className="glass-card p-4 shadow-sm flex flex-col gap-4">
                        {/* Header: Status badge & Actions */}
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 flex flex-col gap-2">
                                <StatusBadge status={property.status} />
                                {property.title && (
                                    <h3 className="font-bold text-base leading-snug text-foreground whitespace-normal break-words line-clamp-3">{t(property.title || "")}</h3>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {property.external_id && (
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/report?id=${property.external_id}`;
                                            navigator.clipboard.writeText(url);
                                            alert(t('property.report_link_copied'));
                                        }}
                                        className="p-2.5 bg-secondary text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
                                        title={t('property.copy_report_link')}
                                    >
                                        <ClipboardCopy className="w-4 h-4" />
                                    </button>
                                )}
                                {canEdit && (
                                    <button
                                        onClick={() => setEditingProperty(property)}
                                        className="p-2.5 bg-primary text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
                                        title={t('action.edit')}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(property.id)}
                                        disabled={deletingId === property.id}
                                        className="p-2.5 bg-error/10 text-error rounded-xl hover:bg-error hover:text-white active:scale-95 transition-all disabled:opacity-50"
                                        title={t('action.delete')}
                                    >
                                        {deletingId === property.id ? (
                                            <span className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Property Details Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4 bg-white/50 rounded-xl p-3 border border-primary/5">
                            {/* Kaufpreis (Highlight) */}
                            <div className="col-span-2 flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('property.purchase_price')}</span>
                                <span className="font-black text-lg text-foreground">
                                    {Number(property.kaufpreis).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('table.id_and_type')}</span>
                                <div className="flex items-center gap-1.5 font-medium text-sm">
                                    <span className="font-mono text-xs bg-black/5 px-1 rounded">{property.external_id || 'N/A'}</span>
                                    {property.link && (
                                        <a href={property.link} target="_blank" rel="noopener noreferrer" className="text-primary bg-primary/10 p-1 rounded-full" title={t('table.open_link')}><ExternalLink className="w-3.5 h-3.5" /></a>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-primary">{t('type.' + (property.objekttyp || 'Kauf'))}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('table.location')}</span>
                                <span className="font-semibold text-sm leading-tight">
                                    {property.plz && property.ort ? `${property.plz} ${property.ort}` : '-'}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('property.phone')}</span>
                                {property.telefonnummer ? (
                                    <div className="flex flex-col items-start gap-2">
                                        <a href={`tel:${property.telefonnummer}`} className="font-bold text-primary text-sm flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate max-w-[120px]">{property.telefonnummer}</span>
                                        </a>
                                        <a href={`https://wa.me/${property.telefonnummer.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded-lg font-bold text-xs">
                                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                            WhatsApp
                                        </a>
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium opacity-50">-</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {showBetreuerColumn ? t('table.agent_date') : t('property.date')}
                                </span>
                                {showBetreuerColumn && (
                                    <span className="font-medium text-sm text-secondary-foreground">
                                        {getBetreuerIcon(property.betreut_von || '☹️')} {t(property.betreut_von || '☹️')}
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground">{property.uebergeben_am ? new Date(property.uebergeben_am).toLocaleDateString('de-AT') : '-'}</span>
                            </div>
                        </div>

                        {/* Status Change App-Style Button */}
                        <div className="pt-2">
                            {updatingStatus === property.id ? (
                                <div className="flex items-center justify-center gap-2 w-full p-3 bg-primary/10 rounded-xl">
                                    <span className="spinner w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                                    <span className="text-sm font-bold text-primary">{t('table.updating_status')}</span>
                                </div>
                            ) : (
                                <select
                                    value={property.status}
                                    onChange={(e) => handleStatusChange(property.id, e.target.value as PropertyStatus)}
                                    disabled={!canChangeStatus}
                                    className="w-full text-base font-bold p-3 rounded-xl border-2 border-primary/20 bg-white text-foreground hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/20 appearance-none shadow-sm transition-all text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                    title={t('property.status_change')}
                                >
                                    <option value="Zu vergeben">👍 Status: {t('status.Zu vergeben')}</option>
                                    <option value="Von GP kontaktiert">📞 Status: {t('status.Von GP kontaktiert')}</option>
                                    <option value="Aufgenommen">📋 Status: {t('status.Aufgenommen')}</option>
                                    <option value="Vermarktung">📣 Status: {t('status.Vermarktung')}</option>
                                    <option value="Abschluss/Verkauf">✅ Status: {t('status.Abschluss/Verkauf')}</option>
                                    <option value="Follow-up">🔄 Status: {t('status.Follow-up')}</option>
                                    <option value="Storniert">❌ Status: {t('status.Storniert')}</option>
                                </select>
                            )}
                        </div>
                    </div>
                ))}
            </div>



            {/* Edit Modal */}
            {editingProperty && (
                <PropertyModal
                    property={editingProperty}
                    isOpen={!!editingProperty}
                    onClose={() => setEditingProperty(null)}
                    onSave={() => {
                        onRefresh();
                        setEditingProperty(null);
                    }}
                    isAdmin={isAdmin}
                    isReadOnly={isReadOnly}
                />
            )}
        </div>
    );
}

export default PropertyTable;
