'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, PlusCircle, TrendingUp, UserCircle2, Menu, X, BarChart3, MessageCircle, LogOut, Users2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';

type SessionUser = {
    displayName?: string;
    username?: string;
    role?: string;
};

export function Sidebar() {
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (e) {
                console.error('Failed to fetch user:', e);
            }
        };
        fetchUser();
    }, []);

    const isAdmin = user?.role === 'admin';
    const isAgent = user?.role === 'agent';
    const personalPath = isAgent
        ? (user?.displayName || user?.username
            ? `/agent/${encodeURIComponent(user.displayName || user.username || '')}`
            : '/agent')
        : '/user';
    const settingsPath = isAgent ? '/agent/settings' : '/user/settings';

    const handleLogout = async () => {
        await fetch('/api/login/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const adminItems = [
        { name: 'Team-Dashboard', href: '/', icon: LayoutGrid },
        { name: 'CRM & Rechnungen', href: '/crm', icon: Users2 },
        { name: 'Benutzer-Verwaltung', href: '/users', icon: UserCircle2 },
        { name: 'Einstellungen', href: '/settings', icon: TrendingUp },
        { name: 'KI Chat', href: '/chat', icon: MessageCircle },
        { name: 'Statistik', href: '/statistik', icon: BarChart3 },
        { name: 'Eingabe', href: '/entry', icon: PlusCircle },
    ];

    const userItems = [
        {
            name: 'Mein Dashboard',
            href: personalPath,
            icon: LayoutGrid
        },
        { name: 'Profil & Passwort', href: settingsPath, icon: UserCircle2 },
    ];

    const navItems = isAdmin
        ? adminItems
        : userItems;
    const mobileTopOffset = 'calc(env(safe-area-inset-top, 0px) + 0.75rem)';
    const mobileLeftOffset = 'calc(env(safe-area-inset-left, 0px) + 0.75rem)';

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed z-[70] p-3 rounded-xl glass hover:bg-primary/10 transition-colors touch-manipulation pointer-events-auto"
                style={{ top: mobileTopOffset, left: mobileLeftOffset }}
                aria-label="MenÃ¼ umschalten"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "w-56 h-[100dvh] overflow-y-auto overflow-x-hidden glass border-r border-primary/10 flex flex-col p-4 fixed left-0 top-0 z-[60] transition-transform duration-300",
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
                }}
            >
                {/* Logo & Branding - Zentriert */}
                <div className="mb-6 shrink-0 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden mb-3">
                        <img
                            src="/logo.png"
                            alt="Open-Akquise Logo"
                            className="w-full h-full object-contain p-2"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Open-Akquise
                        </h1>
                        <p className="text-xs text-muted-foreground">Immo Dashboard</p>
                    </div>
                </div>

                {/* User Info */}
                {user && (
                    <div className="mb-6 px-2 py-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Angemeldet als</div>
                        <div className="text-sm font-bold truncate">{user.displayName || user.username}</div>
                        <div className="text-[10px] text-primary font-bold uppercase">{user.role}</div>
                        {isReadOnlyDemo && (
                            <div className="mt-2 text-[10px] font-bold uppercase text-muted-foreground">Demo Read-only</div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 space-y-2 pb-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block relative group"
                                onClick={() => setIsOpen(false)}
                            >
                                {isActive && (
                                    <div
                                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/15 to-teal-400/15"
                                    />
                                )}
                                <div
                                    className={clsx(
                                        'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                    )}
                                >
                                    <Icon
                                        className={clsx(
                                            "w-5 h-5 transition-colors shrink-0",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                        )}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="mt-auto pt-6 pb-2 shrink-0 border-t border-primary/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-error hover:bg-error/5 transition-all group"
                    >
                        <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-error transition-colors" />
                        <span className="font-medium text-sm">Abmelden</span>
                    </button>

                    <div className="flex items-center gap-3 px-2 mt-4 opacity-50">
                        <TrendingUp className="w-4 h-4 text-success shrink-0" />
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">System Online</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Sidebar;

