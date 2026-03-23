'use client';

import { useState, FormEvent } from 'react';
import { PropertyFormData, PropertyStatus, PropertyType } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface PropertyFormProps {
    onSuccess?: () => void;
    initialData?: Partial<PropertyFormData>;
    isEdit?: boolean;
}

export function PropertyForm({ onSuccess, initialData, isEdit = false }: PropertyFormProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<PropertyFormData>({
        link: initialData?.link || '',
        title: initialData?.title || '',
        external_id: initialData?.external_id || '',
        uebergeben_am: initialData?.uebergeben_am || new Date().toISOString().split('T')[0],
        status: initialData?.status || 'Zu vergeben',
        kaufpreis: initialData?.kaufpreis || 0,
        email: initialData?.email || '',
        telefonnummer: initialData?.telefonnummer || '',
        objekttyp: initialData?.objekttyp || 'Kauf',
        plz: initialData?.plz || '',
        ort: initialData?.ort || '',
        betreut_von: initialData?.betreut_von || '☹️',
        provision_abgeber_custom: initialData?.provision_abgeber_custom || '',
        provision_kaeufer_custom: initialData?.provision_kaeufer_custom || '',
        notizfeld: initialData?.notizfeld || ''
    });

    // Automatische Berechnungen
    const gesamtprovision = formData.kaufpreis * 0.06; // 6% des Kaufpreises
    const provision_abgeber = formData.kaufpreis * 0.03; // 3% für Abgeber
    const provision_kaeufer = formData.kaufpreis * 0.03; // 3% für Käufer
    const berechnung = gesamtprovision * 0.1; // 10% der Gesamtprovision

    // Try to extract external_source ID from link
    // Try to extract external_source ID from link
    const extractexternal_sourceId = (url: string) => {
        try {
            // Updated regex to handle optional trailing slash and find strict numeric ID at end of path
            const match = url.match(/(\d+)\/?$/);
            if (match && match[1]) {
                setFormData(prev => ({ ...prev, external_id: match[1] }));
            }
        } catch (e) {
            // Ignore extraction errors
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || t('property.save_error_full')));
            }

            setSuccess(true);

            // Reset form after success
            if (!isEdit) {
                setFormData({
                    link: '',
                    title: '',
                    external_id: '',
                    uebergeben_am: new Date().toISOString().split('T')[0],
                    status: 'Zu vergeben',
                    kaufpreis: 0,
                    email: '',
                    telefonnummer: '',
                    objekttyp: 'Kauf',
                    plz: '',
                    ort: '',
                    betreut_von: '☹️',
                    provision_abgeber_custom: '',
                    provision_kaeufer_custom: '',
                    notizfeld: ''
                });
            }

            if (onSuccess) {
                onSuccess();
            }

            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            link: '',
            title: '',
            external_id: '',
            uebergeben_am: new Date().toISOString().split('T')[0],
            status: 'Zu vergeben',
            kaufpreis: 0,
            email: '',
            telefonnummer: '',
            objekttyp: 'Kauf',
            plz: '',
            ort: '',
            betreut_von: '☹️',
            provision_abgeber_custom: '',
            provision_kaeufer_custom: '',
            notizfeld: ''
        });
        setError('');
        setSuccess(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success animate-fade-in">
                    {t('property.success_saved')}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                    <label htmlFor="property_link" className="block text-sm font-medium mb-2">
                        {t('property.link_label')} <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="property_link"
                            title={t('property.link_label')}
                            type="url"
                            required
                            value={formData.link}
                            onChange={(e) => {
                                setFormData({ ...formData, link: e.target.value });
                                extractexternal_sourceId(e.target.value);
                            }}
                            placeholder="https://external_source.at/iad/immobilien/..."
                            className="input-field flex-1 py-2"
                        />
                        {formData.link && (
                            <a
                                href={formData.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center shadow-sm"
                                title={t('property.open_listing')}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="uebergeben_am" className="block text-sm font-medium mb-2">
                        {t('property.published_at')} <span className="text-error">*</span>
                    </label>
                    <input
                        id="uebergeben_am"
                        title={t('property.published_date_title')}
                        type="date"
                        required
                        value={formData.uebergeben_am}
                        onChange={(e) => setFormData({ ...formData, uebergeben_am: e.target.value })}
                        className="input-field w-full py-2"
                    />
                </div>
            </div>

            {/* Title Row (Full Width) */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                    {t('property.listing_title')}
                </label>
                <input
                    id="title"
                    title={t('property.listing_title')}
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('property.listing_title_placeholder_full')}
                    className="input-field w-full py-2.5 text-lg font-semibold"
                />
            </div>

            {/* ID & Provision Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="external_id" className="block text-sm font-medium mb-2">
                        {t('property.external_id')}
                    </label>
                    <input
                        id="external_id"
                        title={t('property.external_id')}
                        type="text"
                        value={formData.external_id}
                        onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                        placeholder={t('property.auto_extracted')}
                        className="input-field w-full py-2"
                    />
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="provision_abgeber_custom" className="block text-sm font-medium mb-2">
                        {t('property.seller_commission')}
                    </label>
                    <input
                        id="provision_abgeber_custom"
                        title={t('property.seller_commission_title')}
                        type="text"
                        inputMode="decimal"
                        value={formData.provision_abgeber_custom}
                        onChange={(e) => setFormData({ ...formData, provision_abgeber_custom: e.target.value })}
                        placeholder="z.B. 3 oder 3.5"
                        className="input-field w-full py-2"
                    />
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="provision_kaeufer_custom" className="block text-sm font-medium mb-2">
                        {t('property.buyer_commission')}
                    </label>
                    <input
                        id="provision_kaeufer_custom"
                        title={t('property.buyer_commission_title')}
                        type="text"
                        inputMode="decimal"
                        value={formData.provision_kaeufer_custom}
                        onChange={(e) => setFormData({ ...formData, provision_kaeufer_custom: e.target.value })}
                        placeholder="z.B. 3 oder 3.5"
                        className="input-field w-full py-2"
                    />
                </div>
            </div>

            {/* Objekttyp & Standort */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Objekttyp */}
                <div>
                    <label htmlFor="objekttyp" className="block text-sm font-medium mb-2">
                        {t('property.property_type')}
                    </label>
                    <select
                        id="objekttyp"
                        title={t('property.property_type_select')}
                        value={formData.objekttyp}
                        onChange={(e) => setFormData({ ...formData, objekttyp: e.target.value as PropertyType })}
                        className="w-full input-field"
                    >
                        <option value="Kauf">{t('property.type_purchase')}</option>
                        <option value="Miete">{t('property.type_rent')}</option>
                        <option value="Grundstück">{t('property.type_land')}</option>
                        <option value="Garage">{t('property.type_garage')}</option>
                        <option value="Gewerblich">{t('property.type_commercial')}</option>
                    </select>
                </div>

                {/* Standort (PLZ & Ort) */}
                <div className="flex gap-2">
                    <div className="w-1/3">
                        <label htmlFor="plz" className="block text-sm font-medium mb-2">
                            {t('property.postal_code')}
                        </label>
                        <input
                            id="plz"
                            title={t('property.postal_code_title')}
                            type="text"
                            value={formData.plz || ''}
                            onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                            placeholder="1010"
                            className="w-full input-field"
                        />
                    </div>
                    <div className="w-2/3">
                        <label htmlFor="ort" className="block text-sm font-medium mb-2">
                            {t('property.city')}
                        </label>
                        <input
                            id="ort"
                            title={t('property.city')}
                            type="text"
                            value={formData.ort || ''}
                            onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                            placeholder="Wien"
                            className="w-full input-field"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Kaufpreis */}
                <div>
                    <label htmlFor="kaufpreis" className="block text-sm font-medium mb-2">
                        {t('property.purchase_price_label')} <span className="text-error">*</span>
                    </label>
                    <input
                        id="kaufpreis"
                        title={t('property.purchase_price_title')}
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.kaufpreis}
                        onChange={(e) => setFormData({ ...formData, kaufpreis: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full"
                    />
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-2">
                        {t('property.status_label')} <span className="text-error">*</span>
                    </label>
                    <select
                        id="status"
                        title={t('property.status_change')}
                        value={formData.status}
                        onChange={(e) => {
                            const newStatus = e.target.value as PropertyStatus;
                            setFormData(prev => ({
                                ...prev,
                                status: newStatus,
                                uebergeben_am: newStatus === 'Aufgenommen' ? new Date().toISOString().split('T')[0] : prev.uebergeben_am
                            }));
                        }}
                        className="w-full"
                    >
                        <option value="Zu vergeben">👍 Zu vergeben</option>
                        <option value="Von GP kontaktiert">📞 Von GP kontaktiert</option>
                        <option value="Aufgenommen">📋 Aufgenommen</option>
                        <option value="Vermarktung">📣 Vermarktung</option>
                        <option value="Abschluss/Verkauf">✅ Abschluss/Verkauf</option>
                        <option value="Follow-up">🔄 Follow-up</option>
                        <option value="Storniert">❌ Storniert</option>
                    </select>
                    <div className="mt-2 text-center h-8">
                        <StatusBadge status={formData.status} />
                    </div>
                </div>

                {/* Betreut von */}
                <div>
                    <label htmlFor="betreut_von" className="block text-sm font-medium mb-2">
                        {t('property.managed_by')}
                    </label>
                    <select
                        id="betreut_von"
                        title={t('property.select_agent')}
                        value={formData.betreut_von}
                        onChange={(e) => setFormData({ ...formData, betreut_von: e.target.value })}
                        className="w-full input-field"
                    >
                        <option value="☹️">☹️ -</option>
                        <option value="Fabian">🧥 Fabian</option>
                        <option value="Markus">👔 Markus</option>
                        <option value="Ahmed">🧔 Ahmed</option>
                        <option value="Kaloyan">🕶️ Kaloyan</option>
                        <option value="Viktoria">👗 Viktoria</option>
                        <option value="Melinda">👒 Melinda</option>
                    </select>
                </div>
            </div>

            {/* Kontakt (Email & Telefon) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                        {t('property.email_optional')}
                    </label>
                    <input
                        id="email"
                        title={t('property.email')}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="kontakt@beispiel.at"
                        className="w-full"
                    />
                </div>
                <div>
                    <label htmlFor="telefonnummer" className="block text-sm font-medium mb-2">
                        {t('property.phone_optional')}
                    </label>
                    <input
                        id="telefonnummer"
                        title={t('property.phone_title')}
                        type="tel"
                        value={formData.telefonnummer}
                        onChange={(e) => setFormData({ ...formData, telefonnummer: e.target.value })}
                        placeholder="+43 664 ..."
                        className="w-full"
                    />
                </div>
            </div>

            {/* Automatische Berechnungen (Grid) */}
            <div className="glass-card p-4 md:p-6 bg-primary/5 border-primary/20">
                <h3 className="text-sm md:text-base font-semibold text-primary mb-3 md:mb-4">{t('property.auto_calculations')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gesamtprovision (6%) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('property.total_provision_label')}
                        </label>
                        <div className="w-full px-4 py-2 rounded-lg bg-white border-2 border-primary/30 text-foreground font-bold text-lg">
                            {gesamtprovision.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('property.total_provision_desc')}
                        </p>
                    </div>

                    {/* Berechnung (10% der Gesamtprovision) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('property.our_share_label')}
                        </label>
                        <div className="w-full px-4 py-2 rounded-lg bg-white border-2 border-secondary/30 text-secondary font-bold text-lg">
                            {berechnung.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('property.our_share_desc')}
                        </p>
                    </div>

                    {/* Provision Abgeber (3%) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('property.provision_seller_label')}
                        </label>
                        <div className="w-full px-4 py-2 rounded-lg bg-white border-2 border-accent-yellow/30 text-foreground font-semibold">
                            {provision_abgeber.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('property.provision_seller_desc')}
                        </p>
                    </div>

                    {/* Provision Käufer (3%) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('property.provision_buyer_label')}
                        </label>
                        <div className="w-full px-4 py-2 rounded-lg bg-white border-2 border-accent-pink/30 text-foreground font-semibold">
                            {provision_kaeufer.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('property.provision_buyer_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tagesdatum (Read-only) */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    {t('property.today_date')}
                </label>
                <div className="w-full px-4 py-2 rounded-lg bg-muted border-2 border-muted-foreground/20 text-muted-foreground">
                    {new Date().toLocaleDateString('de-AT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Notizfeld */}
            <div>
                <label htmlFor="notizfeld" className="block text-sm font-medium mb-2">
                    {t('property.notes')}
                </label>
                <textarea
                    id="notizfeld"
                    title={t('property.notes')}
                    value={formData.notizfeld}
                    onChange={(e) => setFormData({ ...formData, notizfeld: e.target.value })}
                    rows={4}
                    placeholder={t('property.additional_info')}
                    className="w-full resize-none"
                />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            {t('property.saving')}
                        </span>
                    ) : (
                        isEdit ? t('property.update') : t('property.create')
                    )}
                </button>

                {!isEdit && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        {t('property.reset')}
                    </button>
                )}
            </div>
        </form>
    );
}

export default PropertyForm;
