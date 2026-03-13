'use client';

import { useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, AlertCircle, Clock, Info, Server, Table2, Key, Zap, Webhook, Bot, ArrowRightLeft } from 'lucide-react';

interface LogEntry {
    step: string;
    status: 'success' | 'error' | 'info';
    message: string;
    duration_ms?: number;
    timestamp: string;
}

interface ColumnDetail {
    name: string;
    type: string;
    nullable: boolean;
}

interface DBTestResult {
    success: boolean;
    message: string;
    details?: {
        tableExists: boolean;
        rowCount: number;
        columns: string[];
        columnDetails: ColumnDetail[];
        serverVersion: string;
        database: string;
        user: string;
        indexes: string[];
        triggers: string[];
    };
    logs: LogEntry[];
    total_duration_ms: number;
}

interface WebhookTestResult {
    success: boolean;
    message?: string;
    error?: string;
    traceId?: string;
    target?: 'test' | 'live' | 'both';
    delivery?: {
        live?: boolean | null;
        test?: boolean | null;
    };
    logs?: {
        target: 'live' | 'test';
        method?: 'POST' | 'GET';
        ok: boolean;
        status?: number | null;
        statusText?: string;
        durationMs?: number;
        url?: string;
        error?: string;
        responseText?: string;
        fallbackUsed?: boolean;
        initialPostStatus?: number | null;
        initialPostError?: string;
        timestamp?: string;
    }[];
    payload?: {
        event?: string;
        source?: string;
        reason?: string;
    };
}

interface SyncResult {
    success: boolean;
    message: string;
    updatedCount?: number;
    errorCount?: number;
    error?: string;
}

export default function SettingsPage() {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<DBTestResult | null>(null);
    const [webhookTesting, setWebhookTesting] = useState(false);
    const [webhookResult, setWebhookResult] = useState<WebhookTestResult | null>(null);
    const [n8nKey, setN8nKey] = useState('');
    const [isN8nActivated, setIsN8nActivated] = useState(false);
    const [activationError, setActivationError] = useState(false);

    const handleActivateN8n = async () => {
        setActivationError(false);
        try {
            const res = await fetch('/api/settings/verify-n8n-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: n8nKey.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setIsN8nActivated(true);
            } else {
                setActivationError(true);
            }
        } catch {
            setActivationError(true);
        }
    };

    const publicSecurityWebhookTestUrl = process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_TEST_URL || 'serverseitig in SECURITY_WEBHOOK_TEST_URL konfiguriert';
    const publicSecurityWebhookLiveUrl = process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_URL || 'serverseitig in SECURITY_WEBHOOK_URL konfiguriert';
    const isWebhookTestConfigured = !publicSecurityWebhookTestUrl.startsWith('serverseitig in ');
    const isWebhookLiveConfigured = !publicSecurityWebhookLiveUrl.startsWith('serverseitig in ');

    const truncateLogValue = (value?: string, maxLength = 320) => {
        if (!value) return '';
        if (value.length <= maxLength) return value;
        return `${value.slice(0, maxLength)}...`;
    };


    const handleTestSecurityWebhook = async (target: 'test' | 'live' | 'both') => {
        if ((target === 'test' || target === 'both') && !isWebhookTestConfigured) {
            setWebhookResult({
                success: false,
                target,
                error: 'Webhook-Test URL ist nicht gesetzt (SECURITY_WEBHOOK_TEST_URL).'
            });
            return;
        }

        if ((target === 'live' || target === 'both') && !isWebhookLiveConfigured) {
            setWebhookResult({
                success: false,
                target,
                error: 'Live Webhook URL ist nicht gesetzt (SECURITY_WEBHOOK_URL).'
            });
            return;
        }

        setWebhookTesting(true);
        setWebhookResult(null);
        try {
            const response = await fetch('/api/settings/test-security-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (response.url.includes('/login')) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Ungueltige Server-Antwort (kein JSON)');
            }

            const data = await response.json();
            if (!response.ok) {
                setWebhookResult({
                    success: false,
                    ...data,
                    error: data?.error || `HTTP ${response.status} ${response.statusText}`,
                });
                return;
            }

            setWebhookResult(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
            setWebhookResult({ success: false, error: 'Netzwerkfehler: ' + message });
        } finally {
            setWebhookTesting(false);
        }
    };

    const handleTestDB = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/settings/test-db');

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (response.url.includes('/login')) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Ungueltige Server-Antwort (kein JSON)');
            }

            const data = await response.json();
            setTestResult(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
            setTestResult({
                success: false,
                message: `Verbindungsfehler: ${message}`,
                logs: [{ step: 'Netzwerk', status: 'error', message, timestamp: new Date().toISOString() }],
                total_duration_ms: 0,
            });
        } finally {
            setTesting(false);
        }
    };

    const getLogIcon = (status: LogEntry['status']) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />;
            case 'error': return <XCircle className="w-4 h-4 text-error flex-shrink-0" />;
            case 'info': return <Info className="w-4 h-4 text-info flex-shrink-0" />;
        }
    };

    const getLogBg = (status: LogEntry['status']) => {
        switch (status) {
            case 'success': return 'bg-success/5 border-success/20';
            case 'error': return 'bg-error/5 border-error/20';
            case 'info': return 'bg-info/5 border-info/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Einstellungen
                </h1>
                <p className="text-muted-foreground mt-1">
                    System-Verwaltung und Datenbank-Diagnose
                </p>
            </div>

            {/* Datenbank Section */}
            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Datenbank-Verbindung</h2>
                        <p className="text-sm text-muted-foreground">
                            Teste die Verbindung und zeige detaillierte Diagnose-Informationen
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleTestDB}
                    disabled={testing}
                    className="btn-primary flex items-center gap-2"
                >
                    {testing ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Teste Verbindung...
                        </>
                    ) : (
                        <>
                            <Database className="w-5 h-5" />
                            DB-Verbindung pruefen
                        </>
                    )}
                </button>

                {testResult && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl border-2 ${testResult.success ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
                            <div className="flex items-center gap-3">
                                {testResult.success ? (
                                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-error flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-bold">
                                        {testResult.success ? 'Verbindung erfolgreich!' : 'Verbindung fehlgeschlagen'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {testResult.message}
                                    </p>
                                </div>
                                {testResult.total_duration_ms > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        {testResult.total_duration_ms}ms
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-4 space-y-2 !transform-none">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-5 h-5 text-accent-yellow" />
                                <h3 className="font-bold text-sm uppercase tracking-wide">Diagnose-Log</h3>
                            </div>
                            <div className="space-y-1.5">
                                {testResult.logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${getLogBg(log.status)}`}
                                    >
                                        <div className="mt-0.5">{getLogIcon(log.status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold">{log.step}:</span>{' '}
                                            <span className="text-muted-foreground break-all">{log.message}</span>
                                        </div>
                                        {log.duration_ms !== undefined && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                                                {log.duration_ms}ms
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold mb-1 uppercase tracking-tight text-xs text-primary">Supabase Setup-Guide:</p>
                            <p className="text-muted-foreground leading-relaxed">
                                Stellen Sie sicher, dass im <strong className="text-foreground">Vercel Dashboard</strong> unter <em className="italic">Project Settings &gt; Environment Variables</em> die Variable <code className="bg-primary/10 text-primary px-1 rounded mx-1">SUPABASE_DATABASE_URL</code> mit dem Connection-Pooling-Port (6543) von Supabase hinterlegt ist. 
                                Für die Frontend-Aktionen werden zudem <code className="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_URL</code> und <code className="bg-primary/10 text-primary px-1 rounded mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> benötigt.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* n8n Automatisierung Section (Zubuchbar) */}
            <div className="glass-card p-6 space-y-6 overflow-hidden relative">
                {!isN8nActivated && (
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-6">
                        <div className="glass-card p-8 max-w-md w-full shadow-2xl border-primary/20 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-yellow/10 flex items-center justify-center">
                                <Key className="w-8 h-8 text-accent-yellow" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">n8n Premium Aktivierung</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Geben Sie Ihren Lizenzschlüssel ein, um die erweiterten Automatisierungs-Funktionen freizuschalten.
                                </p>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Lizenzschlüssel</label>
                                <input 
                                    type="password"
                                    value={n8nKey}
                                    onChange={(e) => setN8nKey(e.target.value)}
                                    placeholder="••••-••••-••••-••••"
                                    className={`w-full px-4 py-3 rounded-xl bg-background border ${activationError ? 'border-error ring-1 ring-error' : 'border-border'} outline-none focus:ring-2 focus:ring-primary transition-all font-mono`}
                                />
                                {activationError && (
                                    <p className="text-xs text-error font-medium ml-1 flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Ungültiger Schlüssel
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={handleActivateN8n}
                                className="btn-primary w-full py-4 shadow-lg shadow-primary/20"
                            >
                                Jetzt freischalten
                            </button>
                            <p className="text-xs text-muted-foreground pt-2">
                                Noch keinen Schlüssel? <a href="mailto:support@echtjetztki.at" className="text-primary hover:underline font-bold">Support kontaktieren</a>
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent-yellow/10">
                        <Bot className="w-6 h-6 text-accent-yellow" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">n8n Automatisierung (Zubuchbar)</h2>
                        <p className="text-sm text-muted-foreground">
                            Erweiterte Workflows, Portal-Abgleiche und KI-Ablaeufe
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm text-muted-foreground mb-4">
                        Diese Premium-Erweiterung beinhaltet den automatischen Abgleich mit Immobilienportalen, KI-gestützte Lead-Analysen und erweiterte Automatisierungs-Workflows.
                    </p>
                    
                    <a 
                        href="https://buy.stripe.com/9B63cv5nZ8n73UZ6GfeQM04" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2 w-fit"
                    >
                        <Zap className="w-4 h-4" />
                        n8n Integration anfragen/buchen
                    </a>
                </div>
            </div>

            {/* Security Webhooks Section */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent-pink/10">
                        <Webhook className="w-6 h-6 text-accent-pink" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Security Webhooks</h2>
                        <p className="text-sm text-muted-foreground">
                            Überwachen Sie Sicherheitsereignisse via Webhook
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleTestSecurityWebhook('test')}
                            disabled={webhookTesting || !isWebhookTestConfigured}
                            className="btn-secondary w-full sm:w-fit flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {webhookTesting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Webhook className="w-4 h-4" />
                            )}
                            Test-Webhook
                        </button>

                        <button
                            onClick={() => handleTestSecurityWebhook('live')}
                            disabled={webhookTesting || !isWebhookLiveConfigured}
                            className="btn-secondary w-full sm:w-fit flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {webhookTesting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            Live-Test
                        </button>
                    </div>

                    {webhookResult && (
                        <div className={`p-3 rounded-lg border text-xs ${webhookResult.success ? 'bg-success/5 border-success/20 text-success-foreground' : 'bg-error/5 border-error/20 text-error'}`}>
                            {webhookResult.success ? 'Erfolgreich gesendet' : `Fehler: ${webhookResult.error}`}
                        </div>
                    )}
                </div>
            </div>

            {/* System Info Section */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-secondary/10">
                        <Info className="w-6 h-6 text-secondary" />
                    </div>
                    <h2 className="text-xl font-bold">System-Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">Version</div>
                        <div className="font-bold">Open-Akquise v2.1</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">Framework</div>
                        <div className="font-bold">Next.js 16 + React 19</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
