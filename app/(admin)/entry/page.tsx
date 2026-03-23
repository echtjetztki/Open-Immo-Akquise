'use client';

import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';
import { useLanguage } from '@/lib/language-context';

const PropertyForm = dynamic(
    () => import('@/components/PropertyForm').then((mod) => mod.PropertyForm),
    { ssr: false }
);

export default function EntryPage() {
    const { t } = useLanguage();
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
                            {t('entry.title')}
                        </h1>
                    </div>
                    <p className="text-xs md:text-base text-muted-foreground ml-10 md:ml-14">
                        {t('entry.description')}
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
                        {t('demo.readonly_entry')}
                    </div>
                ) : (
                    <PropertyForm onSuccess={handleSuccess} />
                )}
            </div>

            {/* Help Text */}
            <div className="glass-card p-4 md:p-6 bg-info/5 border-info/20">
                <h3 className="font-semibold text-info mb-2 flex items-center gap-2">
                    {t('entry.hints')}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• {t('entry.hint_source_id')}</li>
                    <li>• {t('entry.hint_commission')}</li>
                    <li>• {t('entry.hint_date')}</li>
                    <li>• {t('entry.redirect_hint')}</li>
                </ul>
            </div>
        </div>
    );
}
