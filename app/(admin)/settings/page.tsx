'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, Clock, Info, Key, Zap, Webhook, Bot, ArrowRightLeft } from 'lucide-react';
import { PUBLIC_DEMO_READ_ONLY, PUBLIC_DEMO_READ_ONLY_MESSAGE } from '@/lib/public-demo-mode';

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
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<DBTestResult | null>(null);
    const [webhookTesting, setWebhookTesting] = useState(false);
    const [webhookResult, setWebhookResult] = useState<WebhookTestResult | null>(null);
    const [n8nKey, setN8nKey] = useState('');
    const [isN8nActivated, setIsN8nActivated] = useState(false);
    const [checkingN8nActivation, setCheckingN8nActivation] = useState(true);
    const [activationError, setActivationError] = useState(false);
    const [activationMessage, setActivationMessage] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [supabaseTesting, setSupabaseTesting] = useState(false);
    const [supabaseResult, setSupabaseResult] = useState<DBTestResult | null>(null);

    useEffect(() => {
        let cancelled = false;

        const checkActivation = async () => {
            setCheckingN8nActivation(true);
            try {
                const response = await fetch('/api/settings/verify-n8n-key', { method: 'GET' });
                const data = await response.json().catch(() => ({}));
                if (cancelled) return;

                const active = response.ok && data?.active === true;
                setIsN8nActivated(active);
                setActivationError(false);
                setActivationMessage(active ? 'n8n API Integration ist aktiviert.' : 'n8n Aktivierungscode erforderlich.');
            } catch {
                if (cancelled) return;
                setIsN8nActivated(false);
                setActivationError(true);
                setActivationMessage('n8n Aktivierungsstatus konnte nicht geladen werden.');
            } finally {
                if (!cancelled) {
                    setCheckingN8nActivation(false);
                }
            }
        };

        void checkActivation();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleActivateN8n = async () => {
        if (isReadOnlyDemo) {
            setActivationError(true);
            setActivationMessage(PUBLIC_DEMO_READ_ONLY_MESSAGE);
            return;
        }

        if (!n8nKey.trim()) {
            setActivationError(true);
            setActivationMessage('Bitte Aktivierungscode eingeben.');
            return;
        }

        setActivationError(false);
        setActivationMessage('');
        try {
            const res = await fetch('/api/settings/verify-n8n-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: n8nKey.trim() })
            });
            const data = await res.json();
            if (res.ok && data?.success === true) {
                setIsN8nActivated(true);
                setActivationError(false);
                setActivationMessage('n8n API Integration wurde erfolgreich aktiviert.');
                setN8nKey('');
            } else {
                setActivationError(true);
                setActivationMessage(data?.error || 'Ungueltiger Aktivierungscode.');
            }
        } catch {
            setActivationError(true);
            setActivationMessage('Netzwerkfehler bei der Aktivierung.');
        }
    };

    const handleSync = async () => {
        if (isReadOnlyDemo) {
            setSyncResult({ success: false, message: PUBLIC_DEMO_READ_ONLY_MESSAGE });
            return;
        }

        if (!isN8nActivated) return;
        setSyncing(true);
        setSyncResult(null);
        try {
            const response = await fetch('/api/cron/sync-locations');
            const data = await response.json();
            setSyncResult(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
            setSyncResult({ success: false, message });
        } finally {
            setSyncing(false);
        }
    };

    const handleTestSupabase = async () => {
        if (isReadOnlyDemo) {
            setSupabaseResult({
                success: false,
                message: PUBLIC_DEMO_READ_ONLY_MESSAGE,
                logs: [{ step: 'Demo', status: 'info', message: PUBLIC_DEMO_READ_ONLY_MESSAGE, timestamp: new Date().toISOString() }],
                total_duration_ms: 0,
            });
            return;
        }

        if (!isN8nActivated) return;
        setSupabaseTesting(true);
        setSupabaseResult(null);
        try {
            const response = await fetch('/api/settings/test-supabase');
            const data = await response.json();
            setSupabaseResult(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
            setSupabaseResult({ success: false, message, logs: [], total_duration_ms: 0 });
        } finally {
            setSupabaseTesting(false);
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
        if (isReadOnlyDemo) {
            setWebhookResult({
                success: false,
                target,
                error: PUBLIC_DEMO_READ_ONLY_MESSAGE
            });
            return;
        }

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
        if (isReadOnlyDemo) {
            setTestResult({
                success: false,
                message: PUBLIC_DEMO_READ_ONLY_MESSAGE,
                logs: [{ step: 'Demo', status: 'info', message: PUBLIC_DEMO_READ_ONLY_MESSAGE, timestamp: new Date().toISOString() }],
                total_duration_ms: 0,
            });
            return;
        }

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

            {isReadOnlyDemo && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-medium text-muted-foreground">
                    {PUBLIC_DEMO_READ_ONLY_MESSAGE} Admin-Aktionen und Diagnosen sind in der oeffentlichen Demo deaktiviert.
                </div>
            )}

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
                    disabled={testing || isReadOnlyDemo}
                    className="btn-primary flex items-center gap-2"
                    suppressHydrationWarning
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
            <div className="glass-card p-6 space-y-6 overflow-hidden relative min-h-[550px] flex flex-col">
                {!isN8nActivated && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl z-20 flex items-center justify-center p-4">
                        <div className="glass-card p-6 md:p-8 max-w-md w-full shadow-2xl border-primary/30 text-center space-y-5 !transform-none">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-yellow/10 flex items-center justify-center">
                                <Key className="w-8 h-8 text-accent-yellow" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">n8n Premium Aktivierung</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Geben Sie Ihren Lizenzschluessel ein, um die erweiterten Automatisierungs-Funktionen freizuschalten.
                                </p>
                            </div>
                            <div className="text-left p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-primary">Funktion & Loesung</p>
                                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                                    <li>Automatischer Import neuer Objekte aus n8n-Workflows (Webhook/API).</li>
                                    <li>Sicherer Datenaustausch mit geschuetztem Endpunkt und App-Key.</li>
                                    <li>Sync-Tools fuer schnelleren Abgleich mit weniger manuellen Schritten.</li>
                                </ul>
                                <p className="text-xs text-muted-foreground">
                                    Nutzen: kuerzere Reaktionszeiten, weniger Fehler und ein reproduzierbarer Team-Prozess.
                                </p>
                                <a
                                    href="https://n8n.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex text-xs font-semibold text-primary hover:underline"
                                >
                                    Mehr zu n8n ansehen
                                </a>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Lizenzschluessel</label>
                                <input
                                    type="password"
                                    value={n8nKey}
                                    onChange={(e) => setN8nKey(e.target.value)}
                                    placeholder="••••-••••-••••-••••"
                                    className={`w-full px-4 py-3 rounded-xl bg-background border ${activationError ? 'border-error ring-1 ring-error' : 'border-border'} outline-none focus:ring-2 focus:ring-primary transition-all font-mono`}
                                    disabled={isReadOnlyDemo || checkingN8nActivation}
                                />
                                {activationMessage && (
                                    <p className={`text-xs ml-1 flex items-center gap-1 ${activationError ? 'text-error font-medium' : 'text-muted-foreground'}`}>
                                        {activationError ? <XCircle className="w-3 h-3" /> : null}
                                        {activationMessage}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleActivateN8n}
                                disabled={isReadOnlyDemo || checkingN8nActivation}
                                className="btn-primary w-full py-3 shadow-lg shadow-primary/20 font-bold"
                                suppressHydrationWarning
                            >
                                {checkingN8nActivation ? 'Pruefe...' : 'Jetzt freischalten'}
                            </button>

                            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Noch keinen Lizenzschluessel?</p>
                                <a
                                    href="https://buy.stripe.com/eVq8wPaIjeLvcrv0hReQM05"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-accent-yellow to-orange-500 hover:scale-[1.02] transition-all shadow-lg shadow-orange-500/20"
                                    suppressHydrationWarning
                                >
                                    <Zap className="w-4 h-4 text-white" />
                                    <span className="text-white font-bold text-sm">Premium direkt buchen</span>
                                </a>
                                <a href="mailto:support@echtjetztki.at" className="text-xs text-primary hover:underline font-bold">
                                    Support kontaktieren
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent-yellow/10">
                        <Bot className="w-6 h-6 text-accent-yellow" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">n8n API Integration</h2>
                        <p className="text-sm text-muted-foreground">
                            Aktiviert Webhook-Automatisierung, sicheren Datenaustausch und schnelleren Objekt-Abgleich.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">n8n Aktivierungscode (einmalig)</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="password"
                                value={n8nKey}
                                onChange={(e) => setN8nKey(e.target.value)}
                                placeholder="Aktivierungscode eingeben"
                                className="flex-1 rounded-lg border border-border px-3 py-2 bg-background text-sm"
                                disabled={isReadOnlyDemo || checkingN8nActivation || isN8nActivated}
                            />
                            <button
                                onClick={handleActivateN8n}
                                disabled={isReadOnlyDemo || checkingN8nActivation || isN8nActivated}
                                className="btn-secondary py-2 px-4 text-sm flex items-center justify-center gap-2"
                                suppressHydrationWarning
                            >
                                <Key className="w-4 h-4" />
                                {checkingN8nActivation ? 'Pruefe...' : 'Aktivieren'}
                            </button>
                        </div>
                        {activationMessage && (
                            <p className={`text-xs ${activationError ? 'text-error' : 'text-primary'}`}>
                                {activationMessage}
                            </p>
                        )}
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Endpunkt (POST / GET)</label>
                            <button 
                                onClick={() => {
                                    const url = window.location.origin + '/api/n8n/properties';
                                    navigator.clipboard.writeText(url);
                                }}
                                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                title="Endpunkt kopieren"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-background border border-border px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
                            /api/n8n/properties
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App-Passwort (Header: x-api-key)</label>
                        <div className="bg-background border border-border px-4 py-3 rounded-lg font-mono text-sm text-muted-foreground italic flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Aus Sicherheitsgruenden nicht im Frontend sichtbar (ENV: N8N_API_KEY)
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Webhook className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Security Webhook Test</h3>
                        </div>
                        
                        <div className="space-y-2 text-xs text-muted-foreground font-mono">
                            <p>TEST: {publicSecurityWebhookTestUrl || 'Nicht konfiguriert'}</p>
                            <p>LIVE: {publicSecurityWebhookLiveUrl || 'Nicht konfiguriert'}</p>
                        </div>

                        {!isWebhookTestConfigured && !isWebhookLiveConfigured && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600">
                                Mindestens eine Webhook-URL ist nicht gesetzt. Buttons bleiben deaktiviert, bis die ENV-Variablen vorhanden sind.
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleTestSecurityWebhook('test')}
                                disabled={webhookTesting || isReadOnlyDemo || !isWebhookTestConfigured}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                suppressHydrationWarning
                            >
                                <Zap className="w-3 h-3" />
                                Test-Webhook senden
                            </button>
                            <button
                                onClick={() => handleTestSecurityWebhook('live')}
                                disabled={webhookTesting || isReadOnlyDemo || !isWebhookLiveConfigured}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                suppressHydrationWarning
                            >
                                <Zap className="w-3 h-3" />
                                Live einmal testen
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                            <button
                                onClick={handleSync}
                                disabled={syncing || isReadOnlyDemo || checkingN8nActivation || !isN8nActivated}
                                className="btn-secondary flex items-center justify-center gap-2"
                                suppressHydrationWarning
                            >
                                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                Anzeigen-Abgleich (Sync)
                            </button>

                            <button
                                onClick={handleTestSupabase}
                                disabled={supabaseTesting || isReadOnlyDemo || checkingN8nActivation || !isN8nActivated}
                                className="btn-secondary flex items-center justify-center gap-2"
                                suppressHydrationWarning
                            >
                                {supabaseTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                Externe DB testen
                            </button>
                    </div>

                    {isN8nActivated && (
                        <div className="flex items-center gap-2 text-primary font-bold px-4 py-2 bg-primary/10 rounded-xl w-fit">
                            <CheckCircle className="w-4 h-4" />
                            Premium-Funktionen sind aktiv
                        </div>
                    )}
                </div>

                    {isN8nActivated && (syncResult || supabaseResult) && (
                        <div className="mt-4 p-4 rounded-xl bg-background border border-border text-xs font-mono overflow-auto max-h-40">
                            {syncResult && (
                                <div className={syncResult.success ? 'text-success' : 'text-error'}>
                                    [Sync] {syncResult.message} {syncResult.updatedCount !== undefined && `(Updated: ${syncResult.updatedCount})`}
                                </div>
                            )}
                            {supabaseResult && (
                                <div className={supabaseResult.success ? 'text-success' : 'text-error'}>
                                    [DB] {supabaseResult.message}
                                </div>
                            )}
                        </div>
                    )}
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
                        <div className="font-bold">Open-Akquise v2.1.0</div>
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
