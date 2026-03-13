'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Server, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_AGENT_OPTIONS } from '@/lib/agent-options';

type AgentListResponse = {
    success?: boolean;
    agents?: string[];
    source?: 'database' | 'default' | 'fallback';
    warning?: string;
};

export default function AgentLoginPage() {
    const [agent, setAgent] = useState('');
    const [agentOptions, setAgentOptions] = useState<string[]>([...DEFAULT_AGENT_OPTIONS]);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [healthResult, setHealthResult] = useState<{ status: string; message: string } | null>(null);
    const [portalType, setPortalType] = useState('Betreuer Login');
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = window.navigator.userAgent;
            if (ua.includes('openakquiseAgent')) {
                setPortalType('Portal Login Agent');
            } else if (ua.includes('OpenAkquiseUser')) {
                setPortalType('Portal Login Betreuer');
            }
        }
    }, []);

    useEffect(() => {
        const loadAgents = async () => {
            try {
                const response = await fetch('/api/agents');
                if (!response.ok) {
                    return;
                }
                const data = await response.json() as AgentListResponse;
                if (Array.isArray(data.agents) && data.agents.length > 0) {
                    setAgentOptions(data.agents);
                }
            } catch {
                // Keep fallback options silently.
            }
        };

        loadAgents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, agent, mode: 'agent' })
            });

            if (response.ok) {
                const data = await response.json();
                const targetPath = data.redirectTo || '/agent';
                router.push(targetPath);
                router.refresh();
            } else {
                const data = await response.json();
                setError(data.error || 'Falsche Zugangsdaten');
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
                            Mehr Infos bei <a href="https://echtjetztki.at/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EchtJetztKI</a>
                        </span>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-white drop-shadow-md">
                            {portalType}
                        </h2>
                        <p className="text-sm text-white/70 mt-2 font-medium">
                            Betreuer auswaehlen und Passwort eingeben
                        </p>

                    </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                <div className="flex items-center justify-center px-4 bg-gray-200/50 border-r border-gray-200">
                                    <div className="text-gray-600 font-bold text-xs uppercase">Agent</div>
                                </div>
                                <select
                                    value={agent}
                                    onChange={(e) => setAgent(e.target.value)}
                                    className="w-full px-4 py-4 text-gray-900 bg-transparent focus:outline-none font-medium text-base"
                                    title="Betreuer auswaehlen"
                                >
                                    <option value="">Betreuer auswaehlen...</option>
                                    {agentOptions.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

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
                        href="/login"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Teamleiter / Admin Login
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
        </div>
    );
}

