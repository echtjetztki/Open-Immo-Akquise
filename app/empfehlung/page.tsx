'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import {
    Users,
    CheckCircle2,
    TrendingUp,
    Send,
    Mail,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PublicReferralForm() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const agentId = searchParams.get('agent');

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState({
        client_name: '',
        client_address: '',
        client_phone: '',
        recommender_name: '',
        recommender_email: '',
        commission_pct: '10',
        notes: '',
        agent_id: agentId || null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/referrals/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                const payload = await res.json().catch(() => ({}));
                setSubmitError(payload?.error || 'Empfehlung konnte nicht gespeichert werden.');
            }
        } catch (error) {
            console.error(error);
            setSubmitError('Empfehlung konnte nicht gespeichert werden.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card p-12 text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{t('ref.success')}</h2>
                        <p className="text-muted-foreground mt-2">{t('ref.success_message')}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-secondary w-full"
                    >
                        {t('ref.send_another')}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto overflow-hidden mb-4 p-1">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {t('ref.entry_title')}
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        {t('ref.entry_desc')}
                    </p>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 md:p-10"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
                                <Users className="w-5 h-5" />
                                {t('ref.client_section')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.client_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        title={t('ref.client_name')}
                                        placeholder="Max Mustermann"
                                        value={formData.client_name}
                                        onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.client_phone')}</label>
                                    <input
                                        type="tel"
                                        title={t('ref.client_phone')}
                                        placeholder="+43 660 ..."
                                        value={formData.client_phone}
                                        onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.client_address')}</label>
                                <input
                                    type="text"
                                    title={t('ref.client_address')}
                                    placeholder="Straße, PLZ Ort"
                                    value={formData.client_address}
                                    onChange={e => setFormData({ ...formData, client_address: e.target.value })}
                                    className="input-field w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-secondary border-b border-secondary/10 pb-2">
                                <TrendingUp className="w-5 h-5" />
                                {t('ref.recommender')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.recommender_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        title={t('ref.recommender_name')}
                                        placeholder="Ihr Vorname & Name"
                                        value={formData.recommender_name}
                                        onChange={e => setFormData({ ...formData, recommender_name: e.target.value })}
                                        className="input-field w-full border-secondary/20 focus:ring-secondary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.recommender_email')}</label>
                                    <input
                                        type="text"
                                        title={t('ref.recommender_email')}
                                        placeholder="E-Mail oder Telefon"
                                        value={formData.recommender_email}
                                        onChange={e => setFormData({ ...formData, recommender_email: e.target.value })}
                                        className="input-field w-full border-secondary/20 focus:ring-secondary/30"
                                    />
                                </div>
                            </div>
                            <input type="hidden" value="10" />
                        </div>

                        <div className="pt-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">{t('ref.notes')}</label>
                            <textarea
                                title={t('ref.notes')}
                                placeholder="Details zum Objekt..."
                                rows={3}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="input-field w-full resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 text-lg font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30"
                        >
                            {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                            {t('ref.send')}
                        </button>
                        {submitError && (
                            <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                                {submitError}
                            </div>
                        )}
                    </form>
                </motion.div>

                <div className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                    &copy; {new Date().getFullYear()} Open-Akquise &bull; Premium Real Estate Solutions
                </div>
            </div>
        </div>
    );
}

export default function EmpfehlungPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /></div>}>
            <PublicReferralForm />
        </Suspense>
    );
}
