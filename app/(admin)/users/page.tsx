'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, RefreshCw, UserCircle, Save, XCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';
import { useLanguage } from '@/lib/language-context';

type UserRole = 'admin' | 'user' | 'agent';

type ManagedUser = {
    id: number;
    username: string;
    role: UserRole;
    display_name?: string;
    created_at: string;
};

type ApiErrorResponse = {
    error?: string;
    details?: string;
};

export default function UserManagementPage() {
    const { t } = useLanguage();
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loadError, setLoadError] = useState('');

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('agent');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const fetchUsers = async () => {
        setRefreshing(true);
        setLoadError('');

        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();

            if (!res.ok) {
                const err = data as ApiErrorResponse;
                const details = err.details ? ` (${err.details})` : '';
                setUsers([]);
                setLoadError((err.error || t('users.load_error')) + details);
                return;
            }

            if (Array.isArray(data)) {
                setUsers(data as ManagedUser[]);
                return;
            }

            setUsers([]);
            setLoadError(t('users.unexpected_response'));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('users.unknown_network_error');
            setLoadError(t('users.network_error_loading') + ': ' + message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    displayName: newDisplayName,
                    role: newRole,
                }),
            });

            const data = await res.json() as ApiErrorResponse;

            if (res.ok) {
                setFormSuccess(t('users.create_success'));
                setNewUsername('');
                setNewPassword('');
                setNewDisplayName('');
                setNewRole('agent');
                await fetchUsers();
                setTimeout(() => {
                    setShowAddModal(false);
                    setFormSuccess('');
                }, 1200);
            } else {
                const details = data.details ? ` (${data.details})` : '';
                setFormError((data.error || t('users.create_error')) + details);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('users.unknown_network_error');
            setFormError(t('users.network_error') + ': ' + message);
        }
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!confirm(t('users.delete_confirm').replace('{name}', username))) return;

        setFormError('');
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });

            if (res.ok) {
                await fetchUsers();
                return;
            }

            const data = await res.json() as ApiErrorResponse;
            const details = data.details ? ` (${data.details})` : '';
            setFormError((data.error || t('users.delete_error')) + details);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('users.unknown_network_error');
            setFormError(t('users.network_error_deleting') + ': ' + message);
        }
    };

    const roleBadge = (role: UserRole) => {
        if (role === 'admin') {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                </span>
            );
        }

        if (role === 'agent') {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-yellow/15 text-accent-yellow text-xs font-bold uppercase">
                    <UserCircle className="w-3.5 h-3.5" />
                    Agent
                </span>
            );
        }

        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                <Shield className="w-3.5 h-3.5" />
                User
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">{t('users.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {t('users.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('users.description')}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchUsers}
                        disabled={refreshing}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {t('action.refresh')}
                    </button>
                    {!isReadOnlyDemo && (
                        <button
                            onClick={() => {
                                setFormError('');
                                setFormSuccess('');
                                setShowAddModal(true);
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            {t('users.new_user')}
                        </button>
                    )}
                </div>
            </div>

            {isReadOnlyDemo && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm text-muted-foreground">
                    {t('demo.users_readonly')}
                </div>
            )}

            {loadError && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    <div className="font-semibold">{t('users.load_error')}</div>
                    <div className="opacity-90 mt-1">{loadError}</div>
                </div>
            )}

            {formError && !showAddModal && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                    <XCircle className="w-5 h-5 flex-shrink-0" /> {formError}
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-primary/10 bg-primary/5">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.user')}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.display_name')}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.role')}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.created_at')}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{t('users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                                                <UserCircle className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="font-bold">{u.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{u.display_name || '-'}</td>
                                    <td className="px-6 py-4">{roleBadge(u.role)}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString('de-AT') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                            disabled={isReadOnlyDemo || u.username === 'admin'}
                                            className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-all disabled:opacity-30"
                                            title={t('action.delete')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        {t('users.no_users')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {!isReadOnlyDemo && showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg glass-card p-8 !bg-gray-900 border-primary/20 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <UserPlus className="text-primary" />
                                    {t('users.new_user')}
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white" title={t('action.close')} aria-label={t('action.close')}>
                                    <XCircle className="w-7 h-7" />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-muted-foreground ml-1">{t('users.username_login')}</label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                        placeholder={t('users.username_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-muted-foreground ml-1">{t('users.password')}</label>
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                        placeholder={t('users.password_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-muted-foreground ml-1">{t('users.display_name')}</label>
                                    <input
                                        type="text"
                                        value={newDisplayName}
                                        onChange={(e) => setNewDisplayName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                        placeholder={t('users.display_name_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-muted-foreground ml-1">{t('users.role')}</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('agent')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newRole === 'agent' ? 'bg-accent-yellow/20 border-accent-yellow text-accent-yellow' : 'bg-background border-border text-muted-foreground'}`}
                                        >
                                            <UserCircle className="w-4 h-4" /> Agent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('user')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newRole === 'user' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border text-muted-foreground'}`}
                                        >
                                            <Shield className="w-4 h-4" /> User
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('admin')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newRole === 'admin' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-background border-border text-muted-foreground'}`}
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Admin
                                        </button>
                                    </div>
                                </div>

                                {formError && (
                                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                                        <XCircle className="w-5 h-5 flex-shrink-0" /> {formError}
                                    </div>
                                )}

                                {formSuccess && (
                                    <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" /> {formSuccess}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn-primary w-full py-4 mt-2 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{t('users.create_now')}</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
