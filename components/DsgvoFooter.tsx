'use client';

import { Shield, Smartphone, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DsgvoFooter() {
    const [isMobileApp, setIsMobileApp] = useState(false);
    const projectName = 'Open-Immo-Akquise';
    const repoUrl = 'https://github.com/echtjetztki/Open-Immo-Akquise/';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('mobile_app') === 'true' || localStorage.getItem('open_akquise_instance_url')) {
                setIsMobileApp(true);
            }
        }
    }, []);

    const resetMobileConnection = () => {
        if (confirm('Möchten Sie die Verbindung zu diesem Dashboard trennen?')) {
            localStorage.removeItem('open_akquise_instance_url');
            window.location.href = '/'; // Redirect to the local bootloader index.html
        }
    };
    const [showDatenschutz, setShowDatenschutz] = useState(false);
    const [showImpressum, setShowImpressum] = useState(false);
    const [showAgb, setShowAgb] = useState(false);

    const resetCookies = () => {
        localStorage.removeItem('cookie_consent');
        localStorage.removeItem('cookie_consent_date');
        window.location.reload();
    };

    return (
        <>
            <footer className="w-full border-t border-primary/10 bg-background/80 backdrop-blur-sm mt-12 py-6 px-4">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt={`${projectName} Logo`} className="h-8 w-auto" />
                        </a>
                                <span>© {new Date().getFullYear()} {projectName} | <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Repository</a></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <a
                                    href="https://www.it-recht-kanzlei.de/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors underline underline-offset-2 flex items-center gap-1.5"
                                >
                                    <Shield className="w-4 h-4" />
                                    Rechtssichere Texte via IT-Recht Kanzlei
                                </a>
                                <button
                                    onClick={() => setShowDatenschutz(true)}
                                    className="hover:text-primary transition-colors underline underline-offset-2"
                                    suppressHydrationWarning
                                >
                                    Rechtliche Hinweise
                                </button>
                                <button
                                    onClick={resetCookies}
                                    className="hover:text-primary transition-colors underline underline-offset-2"
                                    suppressHydrationWarning
                                >
                                    Cookie-Einstellungen
                                </button>
                                {isMobileApp && (
                                    <button
                                        onClick={resetMobileConnection}
                                        className="flex items-center gap-1.5 text-error hover:opacity-80 transition-opacity font-bold"
                                        title="Dashboard Verbindung trennen"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        App Trennen
                                    </button>
                                )}
                            </div>
                </div>
            </footer>

            {/* Datenschutzerklärung Modal */}
            {showDatenschutz && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDatenschutz(false)} />
                    <div className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-background border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-primary/10 flex-shrink-0">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Datenschutzerklärung</h2>
                            <button onClick={() => setShowDatenschutz(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                Bei {projectName} handelt es sich um ein Open-Source-Projekt. 
                                Sämtliche Rechtstexte (Datenschutz, Impressum, AGB) müssen vom jeweiligen Betreiber individuell erstellt werden.
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="mb-4">Wir empfehlen für die Erstellung rechtssicherer Texte die:</p>
                                <a 
                                    href="https://www.it-recht-kanzlei.de/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xl font-bold text-primary hover:underline"
                                >
                                    IT-Recht Kanzlei München
                                </a>
                            </div>
                            <p className="text-sm">
                                Bitte achte darauf, dein Dashboard gemäß den lokalen gesetzlichen Bestimmungen abzusichern.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Impressum Modal */}
            {showImpressum && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowImpressum(false)} />
                    <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-background border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-primary/10 flex-shrink-0">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Impressum</h2>
                            <button onClick={() => setShowImpressum(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                Dieses Dashboard ist ein Open-Source-Projekt. Der Betreiber ist verpflichtet, ein eigenes Impressum gemäß den gesetzlichen Anforderungen zu erstellen.
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="mb-4">Für rechtssichere Texte und Abmahnrealschutz empfehlen wir:</p>
                                <a 
                                    href="https://www.it-recht-kanzlei.de/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xl font-bold text-primary hover:underline"
                                >
                                    IT-Recht Kanzlei München
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AGB Modal */}
            {showAgb && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAgb(false)} />
                    <div className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-background border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-primary/10 flex-shrink-0">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Allgemeine Geschäftsbedingungen</h2>
                            <button onClick={() => setShowAgb(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                Als Open-Source-Software liefert {projectName} keine vordefinierten AGB aus. Jeder Nutzer ist für die Erstellung und Einbindung rechtlich korrekter AGB selbst verantwortlich.
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="mb-4">Wir empfehlen die Nutzung spezialisierter Dienste wie:</p>
                                <a 
                                    href="https://www.it-recht-kanzlei.de/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xl font-bold text-primary hover:underline"
                                >
                                    IT-Recht Kanzlei München
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

