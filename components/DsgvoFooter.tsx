'use client';

import { Shield, Smartphone, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';

import { _r, _s } from '@/lib/rc';
const _0xf = _r;
const _k1 = _s.e;
const _k2 = '0956274939155f0424592827145b';
const _ua1 = '29471d570a1b431838471202145215503e1d';
const _ua2 = '29471d570a1b4318384712011256165d2a0256';
const _qp = _s.d;
const _rv = '0956275828045b023f09133b1554175725155119';

function FlagDE({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
            <rect width="640" height="160" fill="#000" />
            <rect y="160" width="640" height="160" fill="#D00" />
            <rect y="320" width="640" height="160" fill="#FFCE00" />
        </svg>
    );
}

function FlagGB({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
            <rect width="640" height="480" fill="#012169" />
            <path d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" fill="#FFF" />
            <path d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" fill="#C8102E" />
            <path d="M241 0v480h160V0H241zM0 160v160h640V160H0z" fill="#FFF" />
            <path d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" fill="#C8102E" />
        </svg>
    );
}

function FlagBG({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
            <rect width="640" height="160" fill="#FFF" />
            <rect y="160" width="640" height="160" fill="#00966E" />
            <rect y="320" width="640" height="160" fill="#D62612" />
        </svg>
    );
}

export function DsgvoFooter() {
    const [isMobileApp, setIsMobileApp] = useState(false);
    const { language, setLanguage, t } = useLanguage();
    const projectName = 'Open-Immo-Akquise';
    const repoUrl = 'https://github.com/echtjetztki/Open-Immo-Akquise/';
    const itRechtUrl = 'https://www.it-recht-kanzlei.de/agb-starterpaket.php?partner_id=1686';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const _c = params.get(_0xf(_qp)) === 'true'
                || localStorage.getItem(_0xf(_k1))
                || navigator.userAgent.includes(_0xf(_ua1))
                || navigator.userAgent.includes(_0xf(_ua2));
            if (_c) {
                setIsMobileApp(true);
            }
        }
    }, []);

    const isPremiumApp = typeof navigator !== 'undefined' && navigator.userAgent.includes(_0xf(_ua1));

    const resetMobileConnection = () => {
        if (confirm(t('footer.disconnect_confirm'))) {
            localStorage.removeItem(_0xf(_k1));
            localStorage.removeItem(_0xf(_k2));
            window.location.href = 'https://localhost/index.html?' + _0xf(_rv);
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
            <footer className="w-full border-t border-primary/10 bg-background/80 backdrop-blur-sm mt-12 pt-6 pb-28 px-4 lg:pl-60">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt={`${projectName} Logo`} className="h-8 w-auto" />
                        </a>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">© {new Date().getFullYear()} {projectName}</span>
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider border border-orange-500/20">
                                    {t('footer.demo_version')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground italic">{t('footer.example_data')}</span>
                                <span className="text-muted-foreground/30">•</span>
                                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Repository</a>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-6">
                        <a
                            href={itRechtUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-90 transition-all flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-primary/5 shadow-sm hover:shadow-md h-12"
                        >
                            <img src="/partner-it-recht.png" alt="IT-Recht Kanzlei Partner" className="h-full w-auto object-contain" />
                            <div className="flex flex-col leading-tight pr-2">
                                <span className="text-[10px] uppercase tracking-wider opacity-60">{t('footer.partner_of')}</span>
                                <span className="font-bold text-foreground">IT-Recht Kanzlei</span>
                            </div>
                        </a>
                                <button
                                    onClick={() => setShowDatenschutz(true)}
                                    className="hover:text-primary transition-colors underline underline-offset-2"
                                    suppressHydrationWarning
                                >
                                    {t('footer.legal_notices')}
                                </button>
                                <button
                                    onClick={resetCookies}
                                    className="hover:text-primary transition-colors underline underline-offset-2"
                                    suppressHydrationWarning
                                >
                                    {t('footer.cookie_settings')}
                                </button>
                                {isMobileApp && isPremiumApp && (
                                    <button
                                        onClick={resetMobileConnection}
                                        className="flex items-center gap-1.5 text-error hover:opacity-80 transition-opacity font-bold"
                                        title={t('footer.disconnect_title')}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('footer.disconnect_app')}
                                    </button>
                                )}
                                <div className="flex items-center gap-2 border border-primary/10 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-xl h-12 shadow-sm">
                                    <button
                                        onClick={() => setLanguage('de')}
                                        className={`flex items-center gap-1.5 transition-opacity ${language === 'de' ? 'opacity-100 font-bold' : 'opacity-50 hover:opacity-100'}`}
                                        title="Deutsch"
                                    >
                                        <FlagDE className="w-5 h-4 rounded-[2px] shadow-sm" /> <span className="text-xs uppercase">DE</span>
                                    </button>
                                    <span className="text-muted-foreground/30">|</span>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`flex items-center gap-1.5 transition-opacity ${language === 'en' ? 'opacity-100 font-bold' : 'opacity-50 hover:opacity-100'}`}
                                        title="English"
                                    >
                                        <FlagGB className="w-5 h-4 rounded-[2px] shadow-sm" /> <span className="text-xs uppercase">EN</span>
                                    </button>
                                    <span className="text-muted-foreground/30">|</span>
                                    <button
                                        onClick={() => setLanguage('bg')}
                                        className={`flex items-center gap-1.5 transition-opacity ${language === 'bg' ? 'opacity-100 font-bold' : 'opacity-50 hover:opacity-100'}`}
                                        title="Български"
                                    >
                                        <FlagBG className="w-5 h-4 rounded-[2px] shadow-sm" /> <span className="text-xs uppercase">BG</span>
                                    </button>
                                </div>
                            </div>
                </div>
            </footer>

            {/* Datenschutzerklärung Modal */}
            {showDatenschutz && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDatenschutz(false)} />
                    <div className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-background border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-primary/10 flex-shrink-0">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t('privacy.title')}</h2>
                            <button onClick={() => setShowDatenschutz(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                {t('privacy.text').replace('{project}', projectName)}
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center gap-4">
                                <p className="mb-2">{t('privacy.recommendation')}</p>
                                <a
                                    href={itRechtUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <img src="/partner-it-recht.png" alt="IT-Recht Kanzlei" className="h-16 w-auto object-contain transition-transform group-hover:scale-105" />
                                    <span className="text-xl font-bold text-primary group-hover:underline">IT-Recht Kanzlei München</span>
                                </a>
                            </div>
                            <p className="text-sm">
                                {t('general.please_secure')}
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
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t('imprint.title')}</h2>
                            <button onClick={() => setShowImpressum(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                {t('imprint.text')}
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center gap-4">
                                <p className="mb-2">{t('imprint.recommendation')}</p>
                                <a
                                    href={itRechtUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <img src="/partner-it-recht.png" alt="IT-Recht Kanzlei" className="h-16 w-auto object-contain transition-transform group-hover:scale-105" />
                                    <span className="text-xl font-bold text-primary group-hover:underline">IT-Recht Kanzlei München</span>
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
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t('terms.title')}</h2>
                            <button onClick={() => setShowAgb(false)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground">✕</button>
                        </div>
                        <div className="overflow-y-auto p-5 md:p-6 text-center space-y-6 custom-scrollbar">
                            <p className="text-lg font-medium text-foreground">
                                {t('terms.text').replace('{project}', projectName)}
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center gap-4">
                                <p className="mb-2">{t('terms.recommendation')}</p>
                                <a
                                    href={itRechtUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <img src="/partner-it-recht.png" alt="IT-Recht Kanzlei" className="h-16 w-auto object-contain transition-transform group-hover:scale-105" />
                                    <span className="text-xl font-bold text-primary group-hover:underline">IT-Recht Kanzlei München</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
