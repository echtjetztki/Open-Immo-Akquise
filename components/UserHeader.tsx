'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, UserCircle, Users2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/lib/language-context';

type SessionUser = {
    displayName?: string;
    username?: string;
    role?: string;
};

export default function UserHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const [user, setUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch {
                // no-op
            }
        };
        fetchUser();
    }, []);

    const isAgentByPath = pathname.startsWith('/agent');
    const isAgent = user?.role === 'agent' || isAgentByPath;
    const dashboardPath = isAgent
        ? (user?.displayName || user?.username
            ? `/agent/${encodeURIComponent(user.displayName || user.username || '')}`
            : '/agent')
        : '/user';
    const settingsPath = isAgent ? '/agent/settings' : '/user/settings';
    const isAdmin = user?.role === 'admin';
    const referralsPath = isAgent
        ? (user?.role === 'agent' ? '/agent/referrals' : '/referral-entry')
        : (isAdmin ? '/referrals' : '/referral-entry');

    const handleLogout = async () => {
        await fetch('/api/login/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const isDashboard = isAgent
        ? pathname.startsWith('/agent/') && pathname !== '/agent/settings' && !pathname.includes('/agent/referrals')
        : pathname === '/user';
    const isSettings = pathname === settingsPath;
    const isReferrals = pathname === referralsPath || pathname.startsWith('/agent/referrals') || pathname === '/referral-entry';

    return (
        <header className="sticky top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background/80 backdrop-blur-md shadow-md">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-20 md:h-28 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Logo" className="h-12 md:h-20 w-auto" />
                        <div className="flex flex-col">
                            <span className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                Open-Akquise
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Immo-Akquise Dashboard</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Menu */}
                <nav className="hidden md:flex items-center gap-2 lg:gap-3">
                    <Link
                        href={dashboardPath}
                        className={clsx(
                            'flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-2xl text-sm lg:text-base font-bold transition-all',
                            isDashboard
                                ? 'text-primary bg-primary/10 shadow-inner'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{t('nav.my_dashboard')}</span>
                    </Link>

                    <Link
                        href={settingsPath}
                        className={clsx(
                            'flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-2xl text-sm lg:text-base font-bold transition-all',
                            isSettings
                                ? 'text-primary bg-primary/10 shadow-inner'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                        )}
                    >
                        <UserCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{t('nav.profile_password')}</span>
                    </Link>

                    <Link
                        href={referralsPath}
                        className={clsx(
                            'flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-2xl text-sm lg:text-base font-bold transition-all',
                            isReferrals
                                ? 'text-primary bg-primary/10 shadow-inner'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                        )}
                    >
                        <Users2 className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{t('nav.referrals')}</span>
                    </Link>

                    <div className="w-px h-8 bg-primary/10 mx-2 lg:mx-3" />

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-2xl text-sm lg:text-base font-bold text-muted-foreground hover:text-error hover:bg-error/5 transition-all"
                    >
                        <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{t('nav.logout')}</span>
                    </button>
                </nav>

                {/* Mobile Icons Menu */}
                <div className="flex md:hidden items-center gap-1">
                    <Link
                        href={dashboardPath}
                        className={clsx(
                            'p-2 rounded-xl transition-all',
                            isDashboard ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-primary/5'
                        )}
                        title={t('nav.my_dashboard')}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                    </Link>

                    <Link
                        href={referralsPath}
                        className={clsx(
                            'p-2 rounded-xl transition-all',
                            isReferrals ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-primary/5'
                        )}
                        title={t('nav.referrals')}
                    >
                        <Users2 className="h-5 w-5" />
                    </Link>

                    <Link
                        href={settingsPath}
                        className={clsx(
                            'p-2 rounded-xl transition-all',
                            isSettings ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-primary/5'
                        )}
                        title={t('nav.profile_password')}
                    >
                        <UserCircle className="h-5 w-5" />
                    </Link>

                    <div className="w-px h-6 bg-primary/10 mx-1" />

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="p-2 rounded-xl text-muted-foreground hover:text-error hover:bg-error/5 transition-all"
                        title={t('nav.logout')}
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
