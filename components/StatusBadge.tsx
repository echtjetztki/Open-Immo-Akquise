'use client';

import { clsx } from 'clsx';
import { PropertyStatus } from '@/lib/types';

interface StatusBadgeProps {
    status: PropertyStatus;
    className?: string;
}

const statusConfig = {
    'NEU': {
        label: 'NEU',
        emoji: '🤖',
        className: 'status-neu',
    },
    'Zu vergeben': {
        label: 'Zu vergeben',
        emoji: '👍',
        className: 'status-zu-vergeben',
    },
    'Von GP kontaktiert': {
        label: 'Von GP kontaktiert',
        emoji: '📞',
        className: 'status-von-gp-kontaktiert',
    },
    'Aufgenommen': {
        label: 'Aufgenommen',
        emoji: '📋',
        className: 'status-aufgenommen',
    },
    'Vermarktung': {
        label: 'Vermarktung',
        emoji: '📣',
        className: 'status-vermarktung',
    },
    'Abschluss/Verkauf': {
        label: 'Abschluss/Verkauf',
        emoji: '✅',
        className: 'status-abschluss-verkauf',
    },
    'Follow-up': {
        label: 'Follow-up',
        emoji: '🔄',
        className: 'status-follow-up',
    },
    'Storniert': {
        label: 'Storniert',
        emoji: '❌',
        className: 'status-storniert',
    }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status || 'Unbekannt',
        emoji: '❓',
        className: 'bg-gray-200 text-gray-700',
    };

    return (
        <span className={clsx('status-badge', config.className, className)}>
            <span>{config.emoji}</span>
            {config.label}
        </span>
    );
}

export default StatusBadge;
