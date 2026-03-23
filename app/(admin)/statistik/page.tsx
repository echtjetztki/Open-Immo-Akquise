'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Euro, TrendingUp, CheckCircle2, Building2, Users, BarChart3,
    Home, RefreshCw, Award, MapPin, Calendar, ArrowUpRight, Percent,
    Download, FileSpreadsheet, FileText, Sun, CalendarDays, CalendarRange, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/lib/language-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewEntries {
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
}

interface StatsData {
    total_properties: number;
    total_commission: number;
    total_earnings: number;
    verkauft_count: number;
    abschluss_total_kaufpreis: number;
    abschluss_total_commission: number;
    abschluss_total_earnings: number;
    new_entries: NewEntries;
    export_data: any[];
    by_status: { status: string; count: number; commission: number; earnings: number }[];
    monthly_sales: { month: string; count: number; commission: number; earnings: number }[];
    by_type: { type: string; count: number; commission: number }[];
    by_agent: { agent: string; count: number; commission: number; earnings: number; verkauft: number }[];
    top_properties: { title: string; kaufpreis: number; gesamtprovision: number; ort: string; status: string }[];
    yearly_comparison: { year: number; count: number; commission: number; earnings: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const euro = (v: number) =>
    v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const statusColorClasses: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    'Zu vergeben': { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/30', dot: 'bg-teal-500' },
    'Von GP kontaktiert': { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', dot: 'bg-purple-500' },
    'Aufgenommen': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' },
    'Vermarktung': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', dot: 'bg-orange-400' },
    'Abschluss/Verkauf': { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', dot: 'bg-green-400' },
    'Follow-up': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' },
    'Storniert': { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500' },
};

// ─── Export Functions ─────────────────────────────────────────────────────────

function exportToExcel(data: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    // Column widths
    const colWidths = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 15) }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Immobilien');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportToTxt(data: any[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const sep = '\t';
    const lines = [
        headers.join(sep),
        ...data.map(row => headers.map(h => String(row[h] ?? '')).join(sep))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function BigStat({
    label, value, sub, icon, colorClass,
}: {
    label: string; value: string | number; sub?: string; icon: React.ReactNode; colorClass: string;
}) {
    return (
        <div className="glass-card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{value}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
    );
}

function TimeCard({
    label, value, icon, colorClass, sub,
}: {
    label: string; value: number; icon: React.ReactNode; colorClass: string; sub?: string;
}) {
    return (
        <div className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm font-medium">{label}</div>
                {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
            </div>
        </div>
    );
}

function BarRow({ label, value, max, colorClass, sub }: {
    label: string; value: number; max: number; colorClass: string; sub?: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (barRef.current) {
            barRef.current.style.width = `${pct}%`;
        }
    }, [pct]);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate max-w-[60%]">{label}</span>
                <span className="text-muted-foreground">{sub || value}</span>
            </div>
            <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                <div
                    ref={barRef}
                    className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                />
            </div>
        </div>
    );
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const barsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        data.forEach((d, i) => {
            if (barsRef.current[i]) {
                const h = Math.max(4, Math.round((d.value / max) * 96));
                barsRef.current[i]!.style.height = `${h}px`;
            }
        });
    }, [data, max]);

    return (
        <div className="flex items-end gap-1 h-24 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                        ref={el => { barsRef.current[i] = el; }}
                        className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-b from-orange-400 to-teal-400 opacity-80"
                    />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {d.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusProgress({ pct, colorClass }: { pct: number; colorClass: string }) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (barRef.current) {
            barRef.current.style.width = `${pct}%`;
        }
    }, [pct]);

    return (
        <div className="h-1.5 rounded-full bg-primary/10">
            <div
                ref={barRef}
                className={`h-full rounded-full ${colorClass}`}
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatistikPage() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
    const [exporting, setExporting] = useState<'excel' | 'txt' | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (!data.error) setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchStats(); }, []);

    const handleRefresh = () => { setRefreshing(true); fetchStats(); };

    const handleExportExcel = () => {
        if (!stats?.export_data?.length) return;
        setExporting('excel');
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            exportToExcel(stats.export_data, `Echt-Jetzt-Export_${dateStr}`);
        } finally { setExporting(null); }
    };

    const handleExportTxt = () => {
        if (!stats?.export_data?.length) return;
        setExporting('txt');
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            exportToTxt(stats.export_data, `Echt-Jetzt-Export_${dateStr}`);
        } finally { setExporting(null); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="spinner w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">{t('stats.loading')}</p>
                </div>
            </div>
        );
    }
    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">{t('stats.no_data')}</p>
            </div>
        );
    }

    const monthlyForYear = stats.monthly_sales.filter(m => m.month.startsWith(String(activeYear)));
    const allMonths = Array.from({ length: 12 }, (_, i) => {
        const key = `${activeYear}-${String(i + 1).padStart(2, '0')}`;
        const found = monthlyForYear.find(m => m.month === key);
        return { label: months[i], value: found?.count || 0, commission: found?.commission || 0 };
    });

    const conversionRate = stats.total_properties > 0
        ? Math.round((stats.verkauft_count / stats.total_properties) * 100) : 0;

    const years = [...new Set(stats.monthly_sales.map(m => Number(m.month.split('-')[0])))].sort();

    return (
        <div className="w-full space-y-8 animate-fade-in pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {t('stats.sales_stats')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('stats.sales_overview')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Export Buttons */}
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting !== null || !stats.export_data?.length}
                        className="btn-secondary flex items-center gap-2 text-sm"
                        title={t('stats.export_as_excel')}
                    >
                        {exporting === 'excel'
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <FileSpreadsheet className="w-4 h-4 text-green-600" />}
                        Excel
                    </button>
                    <button
                        onClick={handleExportTxt}
                        disabled={exporting !== null || !stats.export_data?.length}
                        className="btn-secondary flex items-center gap-2 text-sm"
                        title={t('stats.export_as_txt')}
                    >
                        {exporting === 'txt'
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <FileText className="w-4 h-4 text-blue-500" />}
                        TXT
                    </button>
                    <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? t('action.loading') : t('action.refresh')}</span>
                    </button>
                </div>
            </div>

            {/* ── Neueingaben nach Zeitraum ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">{t('stats.new_entries')}</h2>
                    <span className="text-sm text-muted-foreground">– {t('stats.by_period')}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <TimeCard
                        label={t('stats.today')}
                        value={stats.new_entries.today}
                        icon={<Sun className="w-6 h-6" />}
                        colorClass="bg-amber-400/20 text-amber-500"
                        sub={new Date().toLocaleDateString('de-AT')}
                    />
                    <TimeCard
                        label={t('stats.this_week')}
                        value={stats.new_entries.this_week}
                        icon={<CalendarDays className="w-6 h-6" />}
                        colorClass="bg-orange-400/20 text-orange-400"
                        sub="Mo – heute"
                    />
                    <TimeCard
                        label={t('stats.this_month')}
                        value={stats.new_entries.this_month}
                        icon={<CalendarRange className="w-6 h-6" />}
                        colorClass="bg-teal-500/20 text-teal-400"
                        sub={new Date().toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })}
                    />
                    <TimeCard
                        label={t('stats.last_month')}
                        value={stats.new_entries.last_month}
                        icon={<Clock className="w-6 h-6" />}
                        colorClass="bg-purple-500/20 text-purple-400"
                        sub={new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
                            .toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })}
                    />
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <BigStat label={t('stats.total_properties')} value={stats.total_properties}
                    icon={<Building2 className="w-5 h-5" />} colorClass="bg-orange-400/20 text-orange-400" sub={t('stats.all_recorded_objects')} />
                <BigStat label={t('stats.closings_sales')} value={stats.verkauft_count}
                    icon={<CheckCircle2 className="w-5 h-5" />} colorClass="bg-green-400/20 text-green-400" sub={`${t('stats.conversion_rate')}: ${conversionRate}%`} />
                <BigStat label={t('stats.commission_sold')} value={euro(stats.abschluss_total_commission)}
                    icon={<Euro className="w-5 h-5" />} colorClass="bg-amber-400/20 text-amber-500" sub={t('stats.only_closing_sale')} />
                <BigStat label={t('stats.net_earnings_sold')} value={euro(stats.abschluss_total_earnings)}
                    icon={<TrendingUp className="w-5 h-5" />} colorClass="bg-teal-500/20 text-teal-400" sub={t('stats.ten_pct_commission')} />
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <BigStat label={t('stats.commission_total_all')} value={euro(stats.total_commission)}
                    icon={<Euro className="w-5 h-5" />} colorClass="bg-purple-500/20 text-purple-400" sub={t('stats.all_statuses')} />
                <BigStat label={t('stats.net_earnings_all')} value={euro(stats.total_earnings)}
                    icon={<TrendingUp className="w-5 h-5" />} colorClass="bg-pink-400/20 text-pink-400" sub={t('stats.all_objects')} />
                <BigStat label={t('stats.purchase_price_sold')} value={euro(stats.abschluss_total_kaufpreis)}
                    icon={<ArrowUpRight className="w-5 h-5" />} colorClass="bg-blue-500/20 text-blue-500" sub={t('stats.closings')} />
                <BigStat label={t('stats.conversion_rate')} value={`${conversionRate} %`}
                    icon={<Percent className="w-5 h-5" />} colorClass="bg-orange-400/20 text-orange-400"
                    sub={`${stats.verkauft_count} ${t('stats.of')} ${stats.total_properties} ${t('stats.sold')}`} />
            </div>

            {/* ── Monthly Chart + Status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Bar Chart */}
                <div className="glass-card p-6 lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold">{t('stats.monthly_entries')}</h2>
                            <p className="text-xs text-muted-foreground">{t('stats.new_objects_per_month')}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {years.map(y => (
                                <button key={y} onClick={() => setActiveYear(y)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeYear === y
                                        ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>
                    <MiniBarChart data={allMonths} />
                    <div className="flex gap-1 w-full">
                        {allMonths.map((m, i) => (
                            <div key={i} className="flex-1 text-center text-xs text-muted-foreground">{m.label}</div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/10">
                        <p className="text-xs text-muted-foreground mb-2">{t('stats.commission_per_month')} ({activeYear})</p>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {allMonths.filter(m => m.commission > 0).slice(0, 6).map((m, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-xs font-bold text-primary">
                                        {m.commission.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                                    </div>
                                    <div className="text-xs text-muted-foreground">{m.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="glass-card p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold">{t('stats.status_distribution')}</h2>
                        <p className="text-xs text-muted-foreground">{t('stats.commission_per_status')}</p>
                    </div>
                    <div className="space-y-4">
                        {stats.by_status.sort((a, b) => b.count - a.count).map(item => {
                            const colors = statusColorClasses[item.status] || { bg: 'bg-slate-400/10', text: 'text-slate-400', dot: 'bg-slate-400' };
                            const barPct = Math.max(4, Math.round((item.count / Math.max(...stats.by_status.map(s => s.count), 1)) * 100));
                            return (
                                <div key={item.status} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                                            <span className="text-sm font-medium truncate max-w-[130px]">{t('status.' + item.status)}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${colors.text}`}>
                                            {item.count}
                                        </span>
                                    </div>
                                    <StatusProgress pct={barPct} colorClass={colors.dot} />
                                    <div className="text-xs text-muted-foreground text-right">{euro(item.commission)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Export Info Banner ── */}
            <div className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-bold">{t('stats.export_data')}</div>
                        <div className="text-sm text-muted-foreground">
                            {stats.export_data?.length || 0} {t('stats.entries')} · {t('stats.all_fields')}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportExcel} disabled={exporting !== null || !stats.export_data?.length}
                        className="btn-primary flex items-center gap-2 text-sm">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel (.xlsx)
                    </button>
                    <button onClick={handleExportTxt} disabled={exporting !== null || !stats.export_data?.length}
                        className="btn-secondary flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        TXT (Tab)
                    </button>
                </div>
            </div>

            {/* ── Jahresvergleich ── */}
            {stats.yearly_comparison.length > 1 && (
                <div className="glass-card p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold">{t('stats.yearly_comparison')}</h2>
                        <p className="text-xs text-muted-foreground">{t('stats.objects_commission_earnings_per_year')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-primary/10">
                                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{t('stats.year')}</th>
                                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">{t('stats.objects')}</th>
                                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">{t('stats.total_commission')}</th>
                                    <th className="text-right py-2 text-muted-foreground font-medium">{t('stats.net_earnings_10pct')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.yearly_comparison.map(y => (
                                    <tr key={y.year} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                                        <td className="py-3 pr-4 font-bold text-primary">{y.year}</td>
                                        <td className="py-3 pr-4 text-right font-medium">{y.count}</td>
                                        <td className="py-3 pr-4 text-right">{euro(y.commission)}</td>
                                        <td className="py-3 text-right text-secondary font-medium">{euro(y.earnings)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Agent Performance + Property Types ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.by_agent.length > 0 && (
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-bold">{t('stats.agent_performance')}</h2>
                                <p className="text-xs text-muted-foreground">{t('stats.sorted_by_commission')}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {stats.by_agent.slice(0, 6).map((agent, idx) => (
                                <div key={agent.agent} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-400' : idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-orange-400 to-teal-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm truncate">{agent.agent}</span>
                                            {idx === 0 && <Award className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-1" />}
                                        </div>
                                        <BarRow label="" value={agent.commission}
                                            max={Math.max(...stats.by_agent.map(a => a.commission), 1)}
                                            colorClass={idx === 0 ? 'bg-amber-400' : 'bg-orange-400'}
                                            sub={euro(agent.commission)} />
                                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span>{agent.count} {t('stats.objects')}</span>
                                            <span>·</span>
                                            <span className="text-success">{agent.verkauft} {t('stats.closings')}</span>
                                            <span>·</span>
                                            <span className="text-secondary">{euro(agent.earnings)} {t('stats.earnings')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-primary" />
                        <div>
                            <h2 className="text-lg font-bold">{t('stats.property_types')}</h2>
                            <p className="text-xs text-muted-foreground">{t('stats.count_commission_by_type')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {stats.by_type.map(typ => (
                            <BarRow key={typ.type} label={t('type.' + typ.type) || typ.type} value={typ.count}
                                max={Math.max(...stats.by_type.map(x => x.count), 1)}
                                colorClass="bg-teal-500" sub={`${typ.count} · ${euro(typ.commission)}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Top Properties ── */}
            {stats.top_properties.length > 0 && (
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <div>
                            <h2 className="text-lg font-bold">{t('stats.top_properties')}</h2>
                            <p className="text-xs text-muted-foreground">{t('stats.most_valuable_properties')}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-primary/10">
                                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-8">#</th>
                                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{t('stats.object')}</th>
                                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium hidden md:table-cell">{t('stats.location')}</th>
                                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">{t('stats.purchase_price')}</th>
                                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium hidden md:table-cell">{t('stats.commission')}</th>
                                    <th className="text-right py-2 text-muted-foreground font-medium">{t('stats.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_properties.map((prop, idx) => {
                                    return (
                                        <tr key={idx} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                                            <td className="py-3 pr-3 text-muted-foreground font-medium">{idx + 1}</td>
                                            <td className="py-3 pr-4 font-medium max-w-[180px] truncate">{prop.title}</td>
                                            <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                                                {prop.ort ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{prop.ort}</span> : '—'}
                                            </td>
                                            <td className="py-3 pr-4 text-right font-bold text-primary">{euro(prop.kaufpreis)}</td>
                                            <td className="py-3 pr-4 text-right text-muted-foreground hidden md:table-cell">{euro(prop.gesamtprovision)}</td>
                                            <td className="py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColorClasses[prop.status]?.bg || 'bg-slate-400/10'} ${statusColorClasses[prop.status]?.text || 'text-slate-400'}`}>
                                                    {t('status.' + prop.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
