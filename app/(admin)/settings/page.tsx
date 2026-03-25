'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, Clock, Info, Key, Zap, Webhook, Bot, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { PUBLIC_DEMO_READ_ONLY, PUBLIC_DEMO_READ_ONLY_MESSAGE } from '@/lib/public-demo-mode';
import { useLanguage } from '@/lib/language-context';

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
    const { t } = useLanguage();
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
    const [licenseInfo, setLicenseInfo] = useState<{
        active: boolean;
        host: string;
        path: string;
        installations: number;
        max_installations: number | null;
        installations_list: { id: number; host: string; path: string; last_verified_at: string }[];
    } | null>(null);
    const [loadingLicense, setLoadingLicense] = useState(true);

    useEffect(() => {
        const fetchLicenseInfo = async () => {
            try {
                const res = await fetch('/api/settings/license-status');
                if (res.ok) {
                    const data = await res.json();
                    setLicenseInfo(data);
                }
            } catch {
                console.error('Could not fetch license info');
            } finally {
                setLoadingLicense(false);
            }
        };
        fetchLicenseInfo();
    }, []);

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
                setActivationMessage(active ? t('settings.n8n_activated') : t('settings.n8n_code_required'));
            } catch {
                if (cancelled) return;
                setIsN8nActivated(false);
                setActivationError(true);
                setActivationMessage(t('settings.n8n_status_error'));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleActivateN8n = async () => {
        if (isReadOnlyDemo) {
            setActivationError(true);
            setActivationMessage(PUBLIC_DEMO_READ_ONLY_MESSAGE);
            return;
        }

        if (!n8nKey.trim()) {
            setActivationError(true);
            setActivationMessage(t('settings.enter_code_please'));
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
                setActivationMessage(t('settings.n8n_activated_success'));
                setN8nKey('');
            } else {
                setActivationError(true);
                setActivationMessage(data?.error || t('settings.invalid_code'));
            }
        } catch {
            setActivationError(true);
            setActivationMessage(t('settings.network_error_activation'));
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
            const message = error instanceof Error ? error.message : t('settings.unknown_error');
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
            const message = error instanceof Error ? error.message : t('settings.unknown_error');
            setSupabaseResult({ success: false, message, logs: [], total_duration_ms: 0 });
        } finally {
            setSupabaseTesting(false);
        }
    };

    const publicSecurityWebhookTestUrl = process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_TEST_URL || '';
    const publicSecurityWebhookLiveUrl = process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_URL || '';
    const isWebhookTestConfigured = !!publicSecurityWebhookTestUrl;
    const isWebhookLiveConfigured = !!publicSecurityWebhookLiveUrl;

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
                error: t('settings.webhook_test_url_missing')
            });
            return;
        }

        if ((target === 'live' || target === 'both') && !isWebhookLiveConfigured) {
            setWebhookResult({
                success: false,
                target,
                error: t('settings.webhook_live_url_missing')
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
                throw new Error(t('settings.invalid_response'));
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
            const message = error instanceof Error ? error.message : t('settings.unknown_error');
            setWebhookResult({ success: false, error: t('settings.network_error_prefix') + message });
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
                throw new Error(t('settings.invalid_response'));
            }

            const data = await response.json();
            setTestResult(data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('settings.unknown_error');
            setTestResult({
                success: false,
                message: t('settings.connection_error_prefix') + message,
                logs: [{ step: t('settings.network_step'), status: 'error', message, timestamp: new Date().toISOString() }],
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
                    {t('settings.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t('settings.description')}
                </p>
            </div>

            {isReadOnlyDemo && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-medium text-muted-foreground">
                    {PUBLIC_DEMO_READ_ONLY_MESSAGE} {t('settings.demo_disabled')}
                </div>
            )}

            {/* Lizenz-Sektion */}
            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Key className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Lizenz-Management</h2>
                            <p className="text-sm text-muted-foreground">
                                Aktive Installationen und Begrenzungen verwalten
                            </p>
                        </div>
                    </div>
                    {licenseInfo?.active && (
                        <div className="flex items-center gap-2 text-success font-bold px-3 py-1 bg-success/10 rounded-full text-xs box-shadow-none">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aktiv
                        </div>
                    )}
                </div>

                {loadingLicense ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Lade Lizenzinformationen...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Host & Pfad</p>
                            <div className="font-mono text-xs break-all truncate" title={`${licenseInfo?.host}${licenseInfo?.path}`}>
                                {licenseInfo?.host}{licenseInfo?.path}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Installationen</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-black ${licenseInfo?.max_installations && licenseInfo?.installations >= licenseInfo.max_installations ? 'text-error' : 'text-primary'}`}>
                                    {licenseInfo?.installations ?? 0}
                                </span>
                                <span className="text-muted-foreground text-xs">/ {licenseInfo?.max_installations ?? '∞'} Seats</span>
                            </div>
                        </div>
                         <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
                            <a href="https://echtjetztki.at/open-immo/" target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-3 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 w-full">
                                <ShoppingBag className="w-3 h-3" />
                                Mehr Seats anfordern
                            </a>
                        </div>
                    </div>
                )}

                <div className="p-4 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20">
                     <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-accent-yellow flex-shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed text-muted-foreground">
                            Eine Installation ist an die Kombination aus <strong className="text-foreground">Domain (Host)</strong> und <strong className="text-foreground">Ordner-Pfad</strong> gebunden. 
                            Beim Erreichen des Limits werden weitere Installationen blockiert. Kontaktieren Sie den Support für eine Erweiterung Ihrer Lizenz.
                        </div>
                    </div>
                </div>
            </div>

            {/* Datenbank Section */}
            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{t('settings.db_connection')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.db_test_desc')}
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
                            {t('settings.testing')}
                        </>
                    ) : (
                        <>
                            <Database className="w-5 h-5" />
                            {t('settings.test_db')}
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
                                        {testResult.success ? t('settings.connected') : t('settings.failed')}
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
                                <h3 className="font-bold text-sm uppercase tracking-wide">{t('settings.diagnostic_log')}</h3>
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
                            <p className="font-bold mb-1 uppercase tracking-tight text-xs text-primary">{t('settings.supabase_guide')}</p>
                            <p className="text-muted-foreground leading-relaxed"
                               dangerouslySetInnerHTML={{ __html: t('settings.supabase_guide_text_de') }}
                            />
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
                                <h3 className="text-xl font-bold">{t('settings.n8n_activation')}</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {t('settings.n8n_activation_desc')}
                                </p>
                            </div>
                            <div className="text-left p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-primary">{t('settings.n8n_features_title')}</p>
                                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                                    <li>{t('settings.n8n_feature_1')}</li>
                                    <li>{t('settings.n8n_feature_2')}</li>
                                    <li>{t('settings.n8n_feature_3')}</li>
                                </ul>
                                <p className="text-xs text-muted-foreground">
                                    {t('settings.n8n_benefit')}
                                </p>
                                <a
                                    href="https://n8n.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex text-xs font-semibold text-primary hover:underline"
                                >
                                    {t('settings.n8n_learn_more')}
                                </a>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t('settings.license_key')}</label>
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
                                {checkingN8nActivation ? t('settings.checking') : t('settings.unlock_now')}
                            </button>

                            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.no_license')}</p>
                                <a
                                    href="https://buy.stripe.com/eVq8wPaIjeLvcrv0hReQM05"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-accent-yellow to-orange-500 hover:scale-[1.02] transition-all shadow-lg shadow-orange-500/20"
                                    suppressHydrationWarning
                                >
                                    <Zap className="w-4 h-4 text-white" />
                                    <span className="text-white font-bold text-sm">{t('settings.buy_premium')}</span>
                                </a>
                                <a href="mailto:support@echtjetztki.at" className="text-xs text-primary hover:underline font-bold">
                                    {t('settings.contact_support')}
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
                        <h2 className="text-xl font-bold">{t('settings.n8n_integration')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.n8n_integration_desc')}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.n8n_code_label')}</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="password"
                                value={n8nKey}
                                onChange={(e) => setN8nKey(e.target.value)}
                                placeholder={t('settings.n8n_code_placeholder')}
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
                                {checkingN8nActivation ? t('settings.checking') : t('settings.activate')}
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
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.api_endpoint')}</label>
                            <button
                                onClick={() => {
                                    const url = window.location.origin + '/api/n8n/properties';
                                    navigator.clipboard.writeText(url);
                                }}
                                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                title={t('settings.copy_endpoint')}
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-background border border-border px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
                            /api/n8n/properties
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('settings.app_password')}</label>
                        <div className="bg-background border border-border px-4 py-3 rounded-lg font-mono text-sm text-muted-foreground italic flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            {t('settings.app_password_hidden')}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Webhook className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('settings.security_webhook_test')}</h3>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground font-mono">
                            <p>TEST: {publicSecurityWebhookTestUrl || t('settings.not_configured')}</p>
                            <p>LIVE: {publicSecurityWebhookLiveUrl || t('settings.not_configured')}</p>
                        </div>

                        {!isWebhookTestConfigured && !isWebhookLiveConfigured && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600">
                                {t('settings.webhook_env_missing')}
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
                                {t('settings.send_test_webhook')}
                            </button>
                            <button
                                onClick={() => handleTestSecurityWebhook('live')}
                                disabled={webhookTesting || isReadOnlyDemo || !isWebhookLiveConfigured}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                                suppressHydrationWarning
                            >
                                <Zap className="w-3 h-3" />
                                {t('settings.test_live_once')}
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
                                {t('settings.sync_listings')}
                            </button>

                            <button
                                onClick={handleTestSupabase}
                                disabled={supabaseTesting || isReadOnlyDemo || checkingN8nActivation || !isN8nActivated}
                                className="btn-secondary flex items-center justify-center gap-2"
                                suppressHydrationWarning
                            >
                                {supabaseTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                {t('settings.test_external_db')}
                            </button>
                    </div>

                    {isN8nActivated && (
                        <div className="flex items-center gap-2 text-primary font-bold px-4 py-2 bg-primary/10 rounded-xl w-fit">
                            <CheckCircle className="w-4 h-4" />
                            {t('settings.premium_active')}
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
                    <h2 className="text-xl font-bold">{t('settings.system_info')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">{t('settings.version')}</div>
                        <div className="font-bold">Open-Akquise v2.1.0</div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1">{t('settings.framework')}</div>
                        <div className="font-bold">Next.js 16 + React 19</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
