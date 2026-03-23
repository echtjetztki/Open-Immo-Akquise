'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function IOSInstallPrompt() {
    const { t } = useLanguage();
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        const isAndroidDevice = /android/i.test(userAgent);

        if (isIOSDevice) setPlatform('ios');
        else if (isAndroidDevice) setPlatform('android');

        // Check if already installed (running in standalone mode)
        const isStandaloneMode =
            ('standalone' in window.navigator && (window.navigator as any).standalone === true) ||
            window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isStandaloneMode);

        // Show prompt if on iOS or Android and not standalone
        if ((isIOSDevice || isAndroidDevice) && !isStandaloneMode) {
            const promptDismissed = localStorage.getItem('ios_prompt_dismissed');
            const dismissalTime = promptDismissed ? parseInt(promptDismissed) : 0;
            const now = new Date().getTime();

            // Show if never dismissed or dismissed more than 7 days ago
            if (now - dismissalTime > 7 * 24 * 60 * 60 * 1000) {
                setShowPrompt(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('ios_prompt_dismissed', new Date().getTime().toString());
    };

    if (!showPrompt || !platform || isStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background/95 backdrop-blur-md border-t border-primary/20 shadow-2xl safe-area-bottom animate-fade-in-up">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4 pr-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 text-white font-bold shadow-lg shadow-primary/20">
                    AI
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-foreground">{t('ios.download_app')}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                        {t('ios.download_desc')}
                    </p>
                    {platform === 'android' ? (
                        <a
                            href="https://play.google.com/store/apps/details?id=at.echtjetztki.openimmoakquise"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-md"
                        >
                            <Download className="w-4 h-4" />
                            {t('ios.open_play_store')}
                        </a>
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground px-4 py-2.5 rounded-lg text-sm">
                            <Smartphone className="w-4 h-4" />
                            {t('ios.ios_coming_soon')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
