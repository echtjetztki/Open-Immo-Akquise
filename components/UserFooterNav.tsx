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

export default function UserFooterNav() {
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

    const isAgent = user?.role === 'agent';
    const dashboardPath = isAgent
        ? (user?.displayName || user?.username
            ? `/agent/${encodeURIComponent(user.displayName || user.username || '')}`
            : '/agent')
        : '/user';
    const settingsPath = isAgent ? '/agent/settings' : '/user/settings';
    const referralsPath = '/referrals';

    const handleLogout = async () => {
        await fetch('/api/login/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const isDashboard = isAgent
        ? pathname.startsWith('/agent/') && pathname !== '/agent/settings'
        : pathname === '/user';
    const isSettings = pathname === settingsPath;
    const isReferrals = pathname === referralsPath;

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 glass">
            <div className={clsx(
                'grid gap-2 p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]',
                isAgent ? 'grid-cols-4' : 'grid-cols-3'
            )}>
                <Link
                    href={dashboardPath}
                    className={clsx(
                        'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-all',
                        isDashboard
                            ? 'text-primary bg-gradient-to-br from-orange-400/15 to-teal-400/15'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    )}
                >
                    <LayoutDashboard className={clsx('h-4 w-4', isDashboard ? 'text-primary' : '')} />
                    <span>{t('nav.my_dashboard')}</span>
                </Link>

                <Link
                    href={settingsPath}
                    className={clsx(
                        'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-all',
                        isSettings
                            ? 'text-primary bg-gradient-to-br from-orange-400/15 to-teal-400/15'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    )}
                >
                    <UserCircle className={clsx('h-4 w-4', isSettings ? 'text-primary' : '')} />
                    <span>{t('nav.profile_password')}</span>
                </Link>

                {isAgent && (
                    <Link
                        href={referralsPath}
                        className={clsx(
                            'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-all',
                            isReferrals
                                ? 'text-primary bg-gradient-to-br from-orange-400/15 to-teal-400/15'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                        )}
                    >
                        <Users2 className={clsx('h-4 w-4', isReferrals ? 'text-primary' : '')} />
                        <span>{t('nav.referrals')}</span>
                    </Link>
                )}

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground hover:text-error hover:bg-error/5 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                </button>
            </div>
        </footer>
    );
}
