'use client';

import { useEffect } from 'react';

type ErrorPageProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function Error({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error('Route error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="glass-card p-6 max-w-xl w-full space-y-4 text-center">
                <h2 className="text-xl font-bold">Unerwarteter Fehler</h2>
                <p className="text-sm text-muted-foreground">
                    Die Seite konnte nicht korrekt geladen werden. Bitte erneut versuchen.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="btn-primary px-4 py-2"
                    >
                        Erneut laden
                    </button>
                    <a href="/login" className="btn-secondary px-4 py-2">
                        Zum Login
                    </a>
                </div>
            </div>
        </div>
    );
}

