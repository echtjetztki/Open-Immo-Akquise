'use client';

import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

export function IOSInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if user is on iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        // Check if already installed (running in standalone mode)
        const isStandaloneMode = ('standalone' in window.navigator) && ((window.navigator as any).standalone === true);
        setIsStandalone(isStandaloneMode);

        // Show prompt if on iOS and not standalone
        if (isIOSDevice && !isStandaloneMode) {
            // Check if user closed it recently (e.g., save in localStorage to not annoy them)
            const promptDismissed = localStorage.getItem('ios_prompt_dismissed');
            const dismissalTime = promptDismissed ? parseInt(promptDismissed) : 0;
            const now = new Date().getTime();
            
            // Show if never dismissed or dismissed more than X days ago (e.g. 7 days: 7 * 24 * 60 * 60 * 1000)
            if (now - dismissalTime > 7 * 24 * 60 * 60 * 1000) {
                 setShowPrompt(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('ios_prompt_dismissed', new Date().getTime().toString());
    };

    if (!showPrompt || !isIOS || isStandalone) return null;

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
                    <h3 className="font-bold text-foreground">App installieren</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Installieren Sie dieses Dashboard als App für den schnellen Zugriff und ein besseres Erlebnis.
                    </p>
                    <div className="bg-primary/5 rounded-lg p-3 text-sm text-foreground flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <span className="bg-background w-6 h-6 rounded flex items-center justify-center font-bold shadow-sm border border-primary/10">1</span>
                           <span>Tippe unten in der Leiste auf das <Share className="inline-block w-4 h-4 mx-1 text-blue-500" /> Teilen-Symbol</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-background w-6 h-6 rounded flex items-center justify-center font-bold shadow-sm border border-primary/10">2</span>
                            <span>Wähle "Zum Home-Bildschirm" aus der Liste</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
