'use client';

import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    colorClass?: string;
    showHoverBar?: boolean;
}

export function MetricCard({
    title,
    value,
    icon,
    trend,
    trendUp,
    colorClass = 'text-primary',
    showHoverBar = true
}: MetricCardProps) {
    return (
        <div
            className="glass-card p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
        >
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 translate-x-4 -translate-y-4">
                {icon}
            </div>

            {/* Icon & Trend */}
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-2 rounded-lg border", colorClass, "bg-current/10 border-current/20")}>
                    <div className={colorClass}>
                        {icon}
                    </div>
                </div>
                {trend && (
                    <span className={clsx("text-xs font-medium px-2 py-1 rounded-full border",
                        trendUp
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-error/10 text-error border-error/20"
                    )}>
                        {trend}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10">
                <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>

            {showHoverBar && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </div>
    );
}

export default MetricCard;
