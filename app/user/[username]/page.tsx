'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { PropertyTable } from '@/components/PropertyTable';
import { Building2, Euro, TrendingUp, CheckCircle, RefreshCw, Upload, Phone, BarChart3, CheckCircle2, Clock, XCircle, ThumbsUp } from 'lucide-react';
import { Property, DashboardStats } from '@/lib/types';
import { PUBLIC_DEMO_READ_ONLY } from '@/lib/public-demo-mode';

export default function UserDashboard() {
    const isReadOnlyDemo = PUBLIC_DEMO_READ_ONLY;
    const params = useParams();
    const username = decodeURIComponent(params.username as string);

    const [stats, setStats] = useState<DashboardStats>({
        total_properties: 0,
        total_commission: 0,
        total_earnings: 0,
        verkauft_count: 0,
        by_status: []
    });
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Zu vergeben':
                return <ThumbsUp className="w-5 h-5" />;
            case 'Von GP kontaktiert':
                return <Phone className="w-5 h-5" />;
            case 'Aufgenommen':
                return <Upload className="w-5 h-5" />;
            case 'Vermarktung':
                return <BarChart3 className="w-5 h-5" />;
            case 'Abschluss/Verkauf':
                return <CheckCircle2 className="w-5 h-5" />;
            case 'Follow-up':
                return <Clock className="w-5 h-5" />;
            case 'Storniert':
                return <XCircle className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const fetchData = async () => {
        try {
            // Fetch stats and properties in parallel
            // We pass the username from the URL as an 'agent' parameter
            const [statsRes, propertiesRes] = await Promise.all([
                fetch(`/api/stats?agent=${encodeURIComponent(username)}`),
                fetch(`/api/properties?agent=${encodeURIComponent(username)}`)
            ]);

            const statsData = await statsRes.json();
            const propertiesData = await propertiesRes.json();

            // Only update if API responses are valid (not error objects)
            if (statsData && !statsData.error) {
                setStats(statsData);
            }
            if (propertiesData && !propertiesData.error && Array.isArray(propertiesData)) {
                setProperties(propertiesData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="spinner w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">Lade Dashboard für {username}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Dashboard - {username}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        Übersicht aller Immobilien von {username}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-secondary flex items-center gap-2"
                    title="Aktualisieren"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{refreshing ? 'Lädt...' : 'Aktualisieren'}</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Gesamt Immobilien"
                    value={stats.total_properties}
                    icon={<Building2 className="w-6 h-6" />}
                    colorClass="text-primary"
                />
                <MetricCard
                    title="Gesamt Provision"
                    value={`${stats.total_commission.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })} €`}
                    icon={<Euro className="w-6 h-6" />}
                    colorClass="text-accent-yellow"
                />
                <MetricCard
                    title="Gesamt Verdient (10%)"
                    value={`${stats.total_earnings.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })} €`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    colorClass="text-secondary"
                />
                <MetricCard
                    title="Verkauft"
                    value={stats.verkauft_count}
                    icon={<CheckCircle className="w-6 h-6" />}
                    colorClass="text-success"
                />
            </div>

            {/* Status Overview */}
            {stats.by_status.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Status Übersicht</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {stats.by_status.map((item) => (
                            <div key={item.status} className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                                <div className="flex justify-center mb-2 text-primary">
                                    {getStatusIcon(item.status)}
                                </div>
                                <div className="text-2xl font-bold text-primary">{item.count}</div>
                                <div className="text-sm text-muted-foreground mt-1">{item.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Properties Table */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Zugeordnete Immobilien</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sie können Status ändern und Notizen bearbeiten
                        </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {properties.length} {properties.length === 1 ? 'Eintrag' : 'Einträge'}
                    </span>
                </div>

                <PropertyTable properties={properties} onRefresh={handleRefresh} showDelete={false} isReadOnly={isReadOnlyDemo} />
            </div>
        </div>
    );
}
