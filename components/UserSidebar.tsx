'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Building2, TrendingUp, Settings, Users } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
    { name: 'User Dashboard', href: '/user', icon: Users },
];

export function UserSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen glass border-r border-primary/10 flex flex-col p-6 fixed left-0 top-0 z-50">
            {/* Logo & Branding - Zentriert */}
            <a
                href="https://github.com/echtjetztki/Open-Immo-Akquise/"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-10 flex flex-col items-center text-center group hover:opacity-90 transition-opacity"
            >
                <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden mb-3 transition-transform group-hover:scale-105">
                    <img
                        src="/logo.png"
                        alt="Open-Akquise Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Open-Akquise
                    </h1>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">KI.at Dashboard</p>
                </div>
            </a>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="block relative group">
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
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                    )}
                                />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-primary/10">
                <div className="flex items-center gap-3 px-2 animate-fade-in">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">System Aktiv</span>
                </div>
            </div>
        </div>
    );
}

export default UserSidebar;

