'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Server, CheckCircle, XCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { _r, _s } from '@/lib/rc';

export default function LoginPage() {
    const demoSignupUrl =
        process.env.NEXT_PUBLIC_DEMO_SIGNUP_URL ||
        'https://echtjetztki.at/open-immo/';
    const licenseSignupUrl =
        process.env.NEXT_PUBLIC_LICENSE_SIGNUP_URL ||
        demoSignupUrl;
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBasicLicenseModal, setShowBasicLicenseModal] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [isBasicLicenseActive, setIsBasicLicenseActive] = useState(false);
    const [basicLicenseKey, setBasicLicenseKey] = useState('');
    const [basicLicenseError, setBasicLicenseError] = useState('');
    const [verifyingBasicLicense, setVerifyingBasicLicense] = useState(false);
    const [checking, setChecking] = useState(false);
    const [healthResult, setHealthResult] = useState<{ status: string; message: string } | null>(null);
    const [portalType, setPortalType] = useState('Portal Login');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = window.navigator.userAgent;
            if (ua.includes(_r(_s.a))) {
                setPortalType('Portal Login Admin');
            } else if (ua.includes(_r(_s.b))) {
                setPortalType('Portal Login Teamleiter');
            }
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const checkBasicLicense = async () => {
            try {
                const response = await fetch('/api/license/verify-basic', { method: 'GET' });
                const data = await response.json();
                setIsBasicLicenseActive(Boolean(data?.active));
            } catch {
                setIsBasicLicenseActive(false);
            }
            setShowBasicLicenseModal(false);
        };

        void checkBasicLicense();
    }, [mounted]);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <span className="text-sm text-white/70">Lade Login...</span>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, mode: 'team' })
            });

            if (response.ok) {
                const data = await response.json();
                const targetPath = data.redirectTo || (data.role === 'admin' ? '/' : '/user');
                router.push(targetPath);
                router.refresh();
            } else {
                const data = await response.json();
                setError(data.error || 'Falsche Zugangsdaten');
                if (response.status === 403) {
                    setIsBasicLicenseActive(false);
                    setShowBasicLicenseModal(true);
                    setShowCodeInput(true);
                }
            }
        } catch {
            setError('Ein Fehler ist aufgetreten');
        } finally {
            setLoading(false);
        }
    };

    const checkHealth = async () => {
        setChecking(true);
        setHealthResult(null);
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setHealthResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
            setHealthResult({ status: 'error', message: 'Netzwerkfehler: ' + message });
        } finally {
            setChecking(false);
        }
    };

    const verifyBasicLicense = async () => {
        setBasicLicenseError('');
        setVerifyingBasicLicense(true);

        try {
            const response = await fetch('/api/license/verify-basic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: basicLicenseKey })
            });

            const data = await response.json();
            if (!response.ok || !data?.success) {
                setBasicLicenseError(data?.error || 'Ungueltiger Basis-Code.');
                return;
            }

            setIsBasicLicenseActive(true);
            setShowBasicLicenseModal(false);
            setBasicLicenseKey('');
        } catch {
            setBasicLicenseError('Netzwerkfehler bei der Code-Pruefung.');
        } finally {
            setVerifyingBasicLicense(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 px-4">
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 bg-[url('/login-bg.png')] brightness-[0.6]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 relative z-10"
            >
                <div className="text-center space-y-4">
                    <div className="flex flex-col items-center justify-center p-10 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl mb-6">
                        <a
                            href="https://github.com/echtjetztki/Open-Immo-Akquise"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform duration-300 inline-block"
                        >
                            <img
                                src="/logo.png"
                                alt="Open-Akquise Logo"
                                className="h-40 w-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                            />
                        </a>
                        <span className="text-base font-semibold mt-6 text-white max-w-xs leading-snug">
                            Projekt 100% mit KI erstellt. <br />
                            Mehr Infos bei <a href="https://echtjetztki.at/" target="_blank" rel="noopener noreferrer" className="text-red-500 underline font-bold hover:text-red-400 transition-colors">EchtJetztKI</a>
                        </span>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-white drop-shadow-md">
                            {portalType}
                        </h2>
                        <p className="text-sm text-white/70 mt-2 font-medium">
                            Teamleiter/Admin: Passwort eingeben
                        </p>

                    </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
                    {!isBasicLicenseActive && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowBasicLicenseModal(true);
                                setShowCodeInput(false);
                            }}
                            className="w-full mb-5 py-3 px-4 rounded-2xl border-2 border-primary text-primary font-extrabold uppercase tracking-wide bg-primary/5 hover:bg-primary/10 transition-colors animate-pulse shadow-lg shadow-primary/20"
                        >
                            Kostenlos starten
                        </button>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                <div className="flex items-center justify-center px-4 bg-gray-200/50 border-r border-gray-200">
                                    <Lock className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none font-medium text-base"
                                    placeholder="Passwort"
                                    required
                                    autoFocus
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-sm flex items-center gap-3 font-medium"
                            >
                                <XCircle className="w-5 h-5" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 shadow-md"
                            suppressHydrationWarning
                        >
                            {loading ? (
                                <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'JETZT ANMELDEN'
                            )}
                        </button>

                    </form>

                    <Link
                        href="/agent"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        Betreuer Login
                    </Link>
                </div>

                <div className="mt-8 text-center pb-8 relative z-20">
                    <button
                        onClick={checkHealth}
                        disabled={checking}
                        className="text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto text-sm group"
                        suppressHydrationWarning
                    >
                        <Server className={`w-4 h-4 transition-colors ${checking ? 'animate-pulse text-white' : ''}`} />
                        {checking ? 'Pruefe Verbindung...' : 'System-Status'}
                    </button>

                    {healthResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-2xl text-left text-sm border mx-auto max-w-xs backdrop-blur-md ${healthResult.status === 'ok'
                                ? 'bg-success/10 border-success/30 text-white'
                                : 'bg-error/10 border-error/30 text-white'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {healthResult.status === 'ok' ? (
                                    <CheckCircle className="w-5 h-5 mt-0.5 text-success flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 mt-0.5 text-error flex-shrink-0" />
                                )}
                                <div>
                                    <div className="font-bold text-sm">
                                        {healthResult.status === 'ok' ? 'Datenbank Online' : 'Verbindungsfehler'}
                                    </div>
                                    <div className="text-xs opacity-70 mt-1 break-words leading-relaxed">{healthResult.message}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {showBasicLicenseModal && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Kostenlos starten</h3>
                        <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                            Waehle deinen Einstieg: Basis Lizenz oder Demo Daten anfordern.
                            Beides ist kostenlos. Zugangsdaten und optionaler Freischalt-Code kommen per E-Mail.
                        </p>
                        <div className="mt-5 space-y-3">
                            <a
                                href={licenseSignupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
                            >
                                Basis Lizenz anfordern (kostenlos)
                            </a>
                            <a
                                href={demoSignupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-2xl border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-colors"
                            >
                                Demo Daten anfordern (kostenlos)
                            </a>
                            {!showCodeInput && (
                                <button
                                    type="button"
                                    onClick={() => setShowCodeInput(true)}
                                    className="w-full py-3 px-4 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Bereits Code erhalten? Hier eingeben
                                </button>
                            )}
                        </div>
                        {showCodeInput && (
                            <div className="mt-4 space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Basis-Code eingeben
                                </label>
                                <input
                                    type="password"
                                    value={basicLicenseKey}
                                    onChange={(e) => setBasicLicenseKey(e.target.value)}
                                    placeholder="Basis-Code"
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {basicLicenseError && (
                                    <p className="text-xs font-medium text-red-600">{basicLicenseError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={verifyBasicLicense}
                                    disabled={verifyingBasicLicense || !basicLicenseKey.trim()}
                                    className="w-full py-3 px-4 rounded-2xl border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-colors disabled:opacity-60"
                                >
                                    {verifyingBasicLicense ? 'Pruefe Code...' : 'Code aktivieren'}
                                </button>
                            </div>
                        )}
                        <div className="mt-5 space-y-3">
                            <button
                                type="button"
                                onClick={() => setShowBasicLicenseModal(false)}
                                className="w-full py-3 px-4 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Schliessen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

