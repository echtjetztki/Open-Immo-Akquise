'use client';

import { Property, PropertyStatus } from '@/lib/types';
import { useState } from 'react';
import { ExternalLink, Calendar, Euro, FileText, Tag, Save, X, Edit3, Phone, User, ClipboardCopy, MessageCircle } from 'lucide-react';

interface UserPropertyCardProps {
    property: Property;
    onStatusUpdate: (id: number, status: PropertyStatus) => void;
    onNoteUpdate: (id: number, note: string) => void;
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

export function UserPropertyCard({ property, onStatusUpdate, onNoteUpdate }: UserPropertyCardProps) {
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempStatus, setTempStatus] = useState<PropertyStatus>(property.status);
    const [tempNote, setTempNote] = useState(property.notizfeld || '');

    const statuses: PropertyStatus[] = ['NEU', 'Zu vergeben', 'Von GP kontaktiert', 'Aufgenommen', 'Vermarktung', 'Abschluss/Verkauf', 'Follow-up', 'Storniert'];

    const statusColors: Record<PropertyStatus, string> = {
        'NEU': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
        'Zu vergeben': 'bg-teal-500/10 text-teal-500 border-teal-500/30',
        'Von GP kontaktiert': 'bg-purple-500/10 text-purple-500 border-purple-500/30',
        'Aufgenommen': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        'Vermarktung': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
        'Abschluss/Verkauf': 'bg-green-500/10 text-green-500 border-green-500/30',
        'Follow-up': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        'Storniert': 'bg-red-500/10 text-red-500 border-red-500/30'
    };

    const handleSaveStatus = () => {
        onStatusUpdate(property.id, tempStatus);
        setIsEditingStatus(false);
    };

    const handleCancelStatus = () => {
        setTempStatus(property.status);
        setIsEditingStatus(false);
    };

    const handleSaveNote = () => {
        onNoteUpdate(property.id, tempNote);
        setIsEditingNote(false);
    };

    const handleCancelNote = () => {
        setTempNote(property.notizfeld || '');
        setIsEditingNote(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('de-AT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (value: number) => {
        return `${value.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} €`;
    };

    return (
        <div className="glass-card p-6 hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
                {/* Header - external_source ID & Link */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            {property.title || property.external_id || `Immobilie #${property.id}`}
                        </h3>
                        {property.title && property.external_id && (
                            <p className="text-xs text-muted-foreground font-mono mb-1">ID: {property.external_id}</p>
                        )}
                        {property.telefonnummer ? (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                <a href={`tel:${property.telefonnummer}`} className="hover:text-primary transition-colors">
                                    {property.telefonnummer}
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Keine Telefonnummer
                            </p>
                        )}

                    </div>

                    <div className="flex gap-2 shrink-0">
                        {property.external_id && (
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/report?id=${property.external_id}`;
                                    navigator.clipboard.writeText(url);
                                    alert('Report-Link kopiert!');
                                }}
                                className="btn-secondary text-sm flex items-center gap-2"
                                title="Report-Link kopieren"
                            >
                                <ClipboardCopy className="w-4 h-4" />
                                <span className="hidden sm:inline">Report Link</span>
                            </button>
                        )}
                        {property.link && (
                            <a
                                href={property.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">Anzeige</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Type & Location Badges */}
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                        {property.objekttyp || 'Kauf'}
                    </span>
                    {(property.plz || property.ort) && (
                        <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium border border-border">
                            {[property.plz, property.ort].filter(Boolean).join(' ')}
                        </span>
                    )}
                </div>

                {/* Property Details (Read-Only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-yellow/10">
                            <Euro className="w-5 h-5 text-accent-yellow" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Kaufpreis</div>
                            <div className="font-bold">{formatCurrency(property.kaufpreis)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10">
                            <Euro className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Provision</div>
                            <div className="font-bold">{formatCurrency(property.gesamtprovision)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10">
                            <User className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Betreut von</div>
                            <div className="font-bold flex items-center gap-1 text-sm md:text-base">
                                {getBetreuerIcon(property.betreut_von || '☹️')}
                                {property.betreut_von || '☹️'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Datum</div>
                            <div className="font-bold text-sm md:text-base">{formatDate(property.tagesdatum)}</div>
                        </div>
                    </div>
                </div>

                {/* Status Editor */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Status
                        </label>
                        {!isEditingStatus && (
                            <button
                                onClick={() => setIsEditingStatus(true)}
                                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                                <Edit3 className="w-3 h-3" />
                                Bearbeiten
                            </button>
                        )}
                    </div>

                    {isEditingStatus ? (
                        <div className="flex gap-2">
                            <select
                                value={tempStatus}
                                onChange={(e) => setTempStatus(e.target.value as PropertyStatus)}
                                className="input flex-1"
                                aria-label="Status auswählen"
                            >
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleSaveStatus}
                                className="btn-primary flex items-center gap-1 px-3"
                                title="Speichern"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancelStatus}
                                className="btn-secondary flex items-center gap-1 px-3"
                                title="Abbrechen"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className={`px-4 py-2 rounded-lg border-2 font-medium text-center ${statusColors[property.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                            {property.status}
                        </div>
                    )}
                </div>

                {/* Notes Editor */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Notizen
                        </label>
                        {!isEditingNote && (
                            <button
                                onClick={() => setIsEditingNote(true)}
                                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                                <Edit3 className="w-3 h-3" />
                                {property.notizfeld ? 'Bearbeiten' : 'Hinzufügen'}
                            </button>
                        )}
                    </div>

                    {isEditingNote ? (
                        <div className="space-y-2">
                            <textarea
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                className="input min-h-[120px] resize-y"
                                placeholder="Notizen zur Immobilie hinzufügen..."
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveNote}
                                    className="btn-primary flex items-center gap-2 flex-1"
                                >
                                    <Save className="w-4 h-4" />
                                    Speichern
                                </button>
                                <button
                                    onClick={handleCancelNote}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg bg-background/50 border border-border min-h-[80px]">
                            {property.notizfeld ? (
                                <p className="text-sm whitespace-pre-wrap">{property.notizfeld}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Keine Notizen vorhanden</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Customer Replies */}
                <div className="space-y-2 mt-4 pt-4 border-t border-border">
                    <label className="text-sm font-medium flex items-center gap-2 text-primary/70 uppercase tracking-wider">
                        <MessageCircle className="w-4 h-4" />
                        Antwort vom Kunden:
                    </label>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 min-h-[60px]">
                        {property.reply_message ? (
                            <p className="text-sm font-semibold text-foreground/90 whitespace-pre-wrap">{property.reply_message}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Keine Antwort vorhanden</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
