'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { 
    Share2, 
    Clock, 
    Phone, 
    MapPin, 
    TrendingUp, 
    Trash2,
    Search,
    RefreshCw,
    UserCircle,
    Mail
} from 'lucide-react';

type Referral = {
    id: string;
    client_name: string;
    client_address: string;
    client_phone: string;
    recommender_name: string;
    recommender_email?: string;
    commission_pct: number;
    status: string;
    notes: string;
    created_at: string;
    agent_id?: string;
    agent?: { displayName?: string, username?: string };
};

type SessionUser = {
    id: string;
    displayName?: string;
    username?: string;
    role?: string;
};

export default function ReferralsPage() {
    const { t } = useLanguage();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch('/api/user/me');
            if (res.ok) setUser(await res.json());
        };
        fetchUser();
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/referrals');
            if (res.ok) {
                const data = await res.json();
                setReferrals(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/referrals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateCommission = async (id: string, newPct: string) => {
        try {
            const res = await fetch(`/api/referrals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commission_pct: parseInt(newPct) })
            });
            if (res.ok) {
                setReferrals(prev => prev.map(r => r.id === id ? { ...r, commission_pct: parseInt(newPct) } : r));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('table.delete_confirm'))) return;
        try {
            const res = await fetch(`/api/referrals/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setReferrals(prev => prev.filter(r => r.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const copyReferralLink = () => {
        let link = `${window.location.origin}/referral-entry`;
        if (user && user.role === 'agent') {
            link += `?agent=${user.id}`;
        }
        navigator.clipboard.writeText(link);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    const filtered = referrals.filter(r => 
        r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.recommender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.agent?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Neu': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Kontaktiert': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Qualifiziert': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Abschluss': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Abgelehnt': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {t('ref.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {user?.role === 'admin' ? 'Alle Empfehlungen im Überblick' : t('ref.entry_desc')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => window.location.href = '/referral-entry'}
                        className="btn-secondary flex items-center gap-2 px-4 py-3"
                        title="Neue Empfehlung manuell"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Neu
                    </button>
                    <button 
                        onClick={copyReferralLink}
                        title={t('ref.link_copy')}
                        className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary/20"
                    >
                        <Share2 className="w-4 h-4" />
                        {copying ? t('ref.link_copied') : t('ref.link_copy')}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-primary/10">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input 
                        type="text" 
                        title={t('action.search')}
                        placeholder={t('action.search')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input-field w-full pl-12"
                    />
                </div>
                <button onClick={fetchReferrals} className="btn-secondary p-2.5" title={t('action.refresh')}>
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(r => (
                        <div key={r.id} className="glass-card flex flex-col hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary/20">
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground leading-tight">{r.client_name}</h3>
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded border mt-1 inline-block ${getStatusStyle(r.status)}`}>
                                                    {r.status}
                                                </span>
                                                {user?.role === 'admin' && r.agent && (
                                                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded border border-secondary/20 bg-secondary/10 text-secondary mt-1 inline-block">
                                                        Agent: {r.agent.displayName || r.agent.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(r.id)} title={t('action.delete')} className="text-muted-foreground hover:text-error transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{r.client_address || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        <a href={`tel:${r.client_phone}`} className="hover:text-primary transition-colors">{r.client_phone || '-'}</a>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-primary/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('ref.recommender')}</span>
                                        <div className="flex items-center gap-1 group/comm">
                                            <select 
                                                value={r.commission_pct} 
                                                title={t('ref.commission')}
                                                onChange={e => handleUpdateCommission(r.id, e.target.value)}
                                                className="text-[10px] font-black uppercase text-primary bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:underline"
                                            >
                                                <option value="5">5%</option>
                                                <option value="10">10%</option>
                                                <option value="15">15%</option>
                                                <option value="20">20%</option>
                                            </select>
                                            <span className="text-[10px] uppercase font-bold text-primary">{t('ref.commission')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-secondary" />
                                        <span className="font-bold text-sm">{r.recommender_name}</span>
                                    </div>
                                    {r.recommender_email && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Mail className="w-3 h-3" />
                                            <span>{r.recommender_email}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {r.notes && (
                                    <div className="p-3 bg-primary/5 rounded-xl text-xs text-muted-foreground italic">
                                        "{r.notes}"
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-secondary/5 border-t border-primary/10 grid grid-cols-2 gap-2">
                                <select 
                                    value={r.status} 
                                    title={t('ref.status')}
                                    onChange={e => handleUpdateStatus(r.id, e.target.value)}
                                    className="text-xs bg-white border border-primary/10 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="Neu">Neu</option>
                                    <option value="Kontaktiert">Kontaktiert</option>
                                    <option value="Qualifiziert">Qualifiziert</option>
                                    <option value="Abschluss">Abschluss</option>
                                    <option value="Abgelehnt">Abgelehnt</option>
                                </select>
                                <div className="text-[10px] text-muted-foreground flex items-center justify-end pr-2 font-mono">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
