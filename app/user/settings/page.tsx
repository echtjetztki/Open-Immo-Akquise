'use client';

import { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, CheckCircle, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserSettingsPage() {
    const [user, setUser] = useState<{ username?: string; role?: string } | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetch('/api/user/me')
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(err => console.error('Failed to fetch user:', err));
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Die neuen Passwörter stimmen nicht überein' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Passwort wurde erfolgreich geändert' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Fehler beim Ändern des Passworts' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Ein Netzwerkfehler ist aufgetreten' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Lade Einstellungen...</div>;
    }

    const roleLabel = user.role === 'admin'
        ? 'Administrator'
        : user.role === 'agent'
            ? 'Betreuer'
            : 'Teamleiter';

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8 px-4">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Mein Profil
                </h1>
                <p className="text-muted-foreground mt-1">
                    Verwalte deine Kontoeinstellungen und Sicherheit
                </p>
            </header>

            {/* Profile Info Card */}
            <div className="glass-card p-6 flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Benutzername</div>
                    <div className="text-2xl font-bold text-foreground">{user.username}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                            {roleLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Password Change Section */}
            <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                        <Key className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Passwort ändern</h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-muted-foreground ml-1">Aktuelles Passwort</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Altes Passwort eingeben"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">Neues Passwort</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Min. 6 Zeichen"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">Passwort bestätigen</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Gleiches Passwort erneut"
                                required
                            />
                        </div>
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${message.type === 'success'
                                    ? 'bg-success/10 border-success/30 text-success'
                                    : 'bg-error/10 border-error/30 text-error'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            {message.text}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Passwort jetzt speichern</span>
                    </button>
                </form>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 italic text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>Bitte speichere dein neues Passwort sicher ab. Nach der Änderung wirst du nicht automatisch abgemeldet.</p>
            </div>
        </div>
    );
}
