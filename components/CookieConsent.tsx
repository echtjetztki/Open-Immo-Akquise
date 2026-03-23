'use client';

import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function CookieConsent() {
    const { t } = useLanguage();
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Small delay so it doesn't flash on load
            const timer = setTimeout(() => setShowBanner(true), 800);
            return () => clearTimeout(timer);
        } else if (consent === 'accepted') {
            loadGtag();
        }
    }, []);

    const loadGtag = () => {
        // Only load if GA_ID is set and not already loaded
        if (!GA_ID || document.getElementById('gtag-script')) return;

        const script = document.createElement('script');
        script.id = 'gtag-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        const inlineScript = document.createElement('script');
        inlineScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
        `;
        document.head.appendChild(inlineScript);
    };

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        localStorage.setItem('cookie_consent_date', new Date().toISOString());
        setShowBanner(false);
        loadGtag();
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        localStorage.setItem('cookie_consent_date', new Date().toISOString());
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-fade-in-up">
            <div className="max-w-3xl mx-auto bg-background border border-primary/20 rounded-2xl shadow-2xl p-5 md:p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground text-base">🍪 {t('cookie.title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {t('cookie.description')}
                        </p>

                        {showDetails && (
                            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground space-y-2">
                                <p><strong className="text-foreground">{t('cookie.necessary')}:</strong> {t('cookie.necessary_desc')}</p>
                                {GA_ID && (
                                    <p><strong className="text-foreground">{t('cookie.analytics')}:</strong> Google Analytics ({GA_ID}) {t('cookie.analytics_desc')}</p>
                                )}
                                <p className="text-xs">{t('cookie.legal_basis')}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <button
                                onClick={handleAccept}
                                className="btn-primary px-5 py-2 text-sm font-semibold shadow-lg shadow-primary/20"
                            >
                                {t('cookie.accept_all')}
                            </button>
                            <button
                                onClick={handleDecline}
                                className="btn-secondary px-5 py-2 text-sm font-semibold"
                            >
                                {t('cookie.necessary_only')}
                            </button>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                            >
                                {showDetails ? t('cookie.hide_details') : t('cookie.show_details')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
