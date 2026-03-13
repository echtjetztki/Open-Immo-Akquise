'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Save, Send, History, ExternalLink } from 'lucide-react';

function ReportPageContent() {
    const searchParams = useSearchParams();
    const external_sourceId = searchParams.get('id');

    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [history, setHistory] = useState<any[]>([]);
    const [propertyInfo, setPropertyInfo] = useState<{ title: string; link: string } | null>(null);

    const options = [
        { label: '🤖 NEU', value: 'NEU' },
        { label: '📞 Kontaktiert', value: 'Kontaktiert' },
        { label: '📋 Aufnahme', value: 'Aufnahme' },
        { label: '📜 Vermittlungsauftrag', value: 'Vermittlungsauftrag' },
        { label: '✅ Verkauft', value: 'Verkauft' },
        { label: '❌ Storniert', value: 'Storniert' },
        { label: '🚫 Kein Interesse', value: 'Kein Interesse' },
        { label: '🔄 Follow-up', value: 'Follow-up' }
    ];

    const fetchHistory = async () => {
        if (!external_sourceId) return;
        setFetchingHistory(true);
        try {
            const res = await fetch(`/api/report?external_id=${external_sourceId}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.reports || []);
                setPropertyInfo(data.property || null);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setFetchingHistory(false);
        }
    };

    useEffect(() => {
        if (external_sourceId) {
            fetchHistory();
        }
    }, [external_sourceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!external_sourceId || !status) {
            setMessage({ type: 'error', text: 'Bitte alle Felder ausfüllen' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    external_id: external_sourceId,
                    status,
                    note
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Bericht erfolgreich gespeichert!' });
                setStatus('');
                setNote('');
                fetchHistory(); // Refresh history
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Fehler beim Speichern');
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!external_sourceId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-error mx-auto" />
                    <h1 className="text-xl font-bold text-foreground">Fehlende ID</h1>
                    <p className="text-muted-foreground">Keine external_source ID in der URL gefunden.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-900 p-4 md:p-8 lg:p-12">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-[url('/login-bg.png')] brightness-[0.3] blur-[5px]"
            />

            <div className="max-w-xl mx-auto space-y-8 animate-fade-in relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary uppercase tracking-tighter drop-shadow-2xl">
                        Objekt Report
                    </h1>
                    {propertyInfo?.title && (
                        <h2 className="text-lg md:text-xl font-bold text-white/90 mt-2 line-clamp-1 drop-shadow-md">{propertyInfo.title}</h2>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-white/60 text-sm font-medium uppercase tracking-widest">external_source ID:</span>
                        {propertyInfo?.link ? (
                            <a
                                href={propertyInfo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary px-3 py-1 rounded-full text-white font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/30 flex items-center gap-1"
                            >
                                {external_sourceId}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        ) : (
                            <span className="bg-primary px-3 py-1 rounded-full text-white font-black text-sm">{external_sourceId}</span>
                        )}
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl p-6 md:p-10 rounded-3xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div>
                            <label className="block text-xs font-black text-white/50 mb-4 uppercase tracking-[0.2em]">Aktueller Status</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setStatus(opt.value)}
                                        className={`px-4 py-3 rounded-2xl border-2 text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${status === opt.value
                                            ? 'bg-white border-white text-primary shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)] scale-[1.02]'
                                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="note" className="block text-xs font-black text-white/50 mb-3 uppercase tracking-[0.2em]">Zusätzliche Notiz</label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="Was ist der nächste Schritt?..."
                                className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 bg-white/5 text-white focus:border-white/40 focus:bg-white/10 transition-all outline-none resize-none font-medium placeholder:text-white/20"
                            />
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-success/20 border border-success/40 text-success' : 'bg-error/20 border border-error/40 text-error'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <span className="text-sm font-black">{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !status}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] hover:bg-right text-white font-black text-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Save className="w-7 h-7" />}
                            REPORT ABSENDEN
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter drop-shadow-lg">
                        <History className="w-7 h-7 text-primary" />
                        Letzte Aktualisierungen
                    </h2>

                    {fetchingHistory && history.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-white/30" />
                        </div>
                    ) : history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col gap-4 hover:bg-white/10 transition-colors shadow-lg">
                                    <div className="flex justify-between items-start">
                                        <span className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full font-black text-[10px] uppercase tracking-[0.15em]">{item.status}</span>
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleString('de-AT')}</span>
                                    </div>
                                    {item.note && <p className="text-base text-white/80 font-medium leading-relaxed whitespace-pre-wrap">{item.note}</p>}
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-success/50" />
                                        <span className="text-[9px] text-white/20 font-mono tracking-tighter">PROTOKOLLIERT VON IP: {item.ip_address}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 text-center border border-white/10">
                            <p className="text-white/30 font-bold italic uppercase tracking-widest">Noch keine Einträge vorhanden.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <ReportPageContent />
        </Suspense>
    );
}

