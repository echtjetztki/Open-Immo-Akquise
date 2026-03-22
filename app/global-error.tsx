'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error('Global app error:', error);
    }, [error]);

    return (
        <html lang="de">
            <body className="min-h-screen bg-background text-foreground">
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="glass-card p-6 max-w-xl w-full space-y-4 text-center">
                        <h1 className="text-2xl font-bold">App-Fehler</h1>
                        <p className="text-sm text-muted-foreground">
                            Die App hat einen unerwarteten Fehler erkannt.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={reset}
                                className="btn-primary px-4 py-2"
                            >
                                App neu laden
                            </button>
                            <a href="/login" className="btn-secondary px-4 py-2">
                                Zum Login
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

