'use client';

import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';

const PropertyForm = dynamic(
    () => import('@/components/PropertyForm').then((mod) => mod.PropertyForm),
    { ssr: false }
);

export default function EntryPage() {
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const router = useRouter();

    const handleSuccess = () => {
        // Optionally redirect to dashboard after successful submission
        setTimeout(() => {
            router.push('/');
        }, 2000);
    };

    return (
        <div className="w-full space-y-6 md:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <Link
                            href="/"
                            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-primary" />
                        </Link>
                        <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Neue Immobilie Eingeben
                        </h1>
                    </div>
                    <p className="text-xs md:text-base text-muted-foreground ml-10 md:ml-14">
                        Erstellen Sie ein neues Immobilienangebot mit automatischer Provisions-Berechnung
                    </p>
                </div>

                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary items-center justify-center shadow-lg shadow-primary/30 ml-4">
                    <PlusCircle className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Form Card */}
            <div className="glass-card p-4 md:p-8">
                {isReadOnlyDemo ? (
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-6 text-sm text-muted-foreground">
                        Die öffentliche Demo ist schreibgeschützt. Neue Immobilien können hier nur in selbst gehosteten Installationen angelegt werden.
                    </div>
                ) : (
                    <PropertyForm onSuccess={handleSuccess} />
                )}
            </div>

            {/* Help Text */}
            <div className="glass-card p-4 md:p-6 bg-info/5 border-info/20">
                <h3 className="font-semibold text-info mb-2 flex items-center gap-2">
                    💡 Hinweise
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Die external_source ID wird automatisch aus dem Link extrahiert</li>
                    <li>• Die Berechnung zeigt automatisch 10% der Gesamtprovision</li>
                    <li>• Das Tagesdatum wird automatisch auf heute gesetzt</li>
                    <li>• Nach dem Speichern werden Sie zum Dashboard weitergeleitet</li>
                </ul>
            </div>
        </div>
    );
}
