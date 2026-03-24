'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, CreditCard, ShoppingBag, Download, ArrowLeft, Info, FileText } from 'lucide-react';
import Script from 'next/script';

declare global {
    interface Window {
        paypal?: any;
    }
}

interface InvoiceItem {
    title: string;
    description: string;
    quantity: number;
    unit_price: string;
    total_price: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    doc_type: string;
    customer_name: string;
    total_amount: string;
    status: string;
    created_at: string;
    due_date?: string;
    notes?: string;
}

export default function PaymentLandingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paypalClientId, setPaypalClientId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'cancelled' | 'error'>('idle');

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/payment/invoices/${params.id}`);
                const data = await res.json();
                if (res.ok) {
                    setInvoice(data.invoice);
                    setItems(data.items);
                    setPaypalClientId(data.paypal_client_id);
                } else {
                    setError(data.error || 'Rechnung nicht gefunden');
                }
            } catch (err) {
                setError('Verbindungsfehler beim Laden der Rechnung.');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchInvoice();
        }

        const status = searchParams.get('status');
        if (status === 'success') setPaymentStatus('success');
        if (status === 'cancelled') setPaymentStatus('cancelled');
    }, [params.id, searchParams]);

    const handleStripePayment = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/payment/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_id: params.id }),
            });
            const data = await res.json();
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                alert('Stripe-Zahlung konnte nicht initialisiert werden.');
            }
        } catch (err) {
            alert('Netzwerkfehler beim Starten der Stripe-Zahlung.');
        } finally {
            setIsProcessing(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'Bezahlt':
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-emerald-600/20"><CheckCircle2 className="w-3.5 h-3.5" /> BEZAHLT</span>;
            case 'Offen':
                if (paymentStatus === 'success') {
                    return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-emerald-600/20"><CheckCircle2 className="w-3.5 h-3.5" /> BEZAHLT</span>;
                }
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold ring-1 ring-orange-600/20"><Clock className="w-3.5 h-3.5" /> OFFEN</span>;
            case 'Inkasso':
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold ring-1 ring-red-600/20">INKASSO</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold ring-1 ring-gray-600/20">{status.toUpperCase()}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-medium animate-pulse">Lade Rechnung...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="glass-card max-w-md w-full p-8 text-center space-y-6 !transform-none shadow-2xl">
                    <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ein Fehler ist aufgetreten</h2>
                        <p className="text-muted-foreground mt-2">{error || 'Die Rechnung konnte nicht gefunden werden.'}</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full py-3 font-bold">Erneut versuchen</button>
                </div>
            </div>
        );
    }

    const formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

    return (
        <div className="min-h-screen bg-[#f2f4f7] py-12 px-4 md:px-6">
            <Script
                src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR`}
                onLoad={() => {
                    if (window.paypal && invoice.status === 'Offen') {
                        window.paypal.Buttons({
                            createOrder: async () => {
                                const response = await fetch('/api/payment/paypal/create-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ invoice_id: invoice.id }),
                                });
                                const content = await response.json();
                                return content.id;
                            },
                            onApprove: async (data: any) => {
                                setIsProcessing(true);
                                const response = await fetch('/api/payment/paypal/capture-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        orderID: data.orderID,
                                        invoice_id: invoice.id 
                                    }),
                                });
                                const content = await response.json();
                                if (content.success) {
                                    setPaymentStatus('success');
                                    setInvoice({...invoice, status: 'Bezahlt'});
                                } else {
                                    setPaymentStatus('error');
                                }
                                setIsProcessing(false);
                            },
                            style: {
                                color: 'gold', shape: 'pill', label: 'pay', height: 48
                            }
                        }).render('#paypal-button-container');
                    }
                }}
            />

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Status Message */}
                <AnimatePresence>
                    {(paymentStatus === 'success' || invoice.status === 'Bezahlt') && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/20 flex items-center justify-between border-2 border-emerald-400/30"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Zahlung erfolgreich!</h3>
                                    <p className="text-emerald-50 text-sm font-medium">Vielen Dank für Ihre Zahlung. Ihre Rechnung wurde beglichen.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Invoice View */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card shadow-xl overflow-hidden !transform-none border-0 ring-1 ring-black/5">
                            <div className="p-8 bg-white space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Abrechnung</p>
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{invoice.invoice_number}</h1>
                                        <div className="flex items-center gap-3 pt-2">
                                            <StatusBadge status={invoice.status} />
                                            <span className="text-slate-400 text-sm font-medium">{new Date(invoice.created_at).toLocaleDateString('de-DE')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center ml-auto">
                                            <FileText className="w-8 h-8 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kunde</p>
                                        <p className="font-bold text-slate-900 leading-tight text-lg">{invoice.customer_name}</p>
                                    </div>
                                    <div className="space-y-3 text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fälligkeitsdatum</p>
                                        <p className="font-bold text-slate-900 text-lg">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('de-DE') : 'Sofort fällig'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Posten</h3>
                                    <div className="space-y-4">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-start group">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{item.title}</p>
                                                    <p className="text-xs text-slate-400 italic">Menge: {Number(item.quantity).toLocaleString('de-DE')} × {formatter.format(Number(item.unit_price))}</p>
                                                </div>
                                                <p className="font-black text-slate-900">{formatter.format(Number(item.total_price))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 flex flex-col items-end border-t border-slate-100">
                                    <div className="w-full max-w-[240px] space-y-3 bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                          <span>Zwischensumme</span>
                                          <span>{formatter.format(Number(invoice.total_amount))}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-200 gap-4">
                                            <span className="text-sm font-black text-slate-900 uppercase">Gesamtsumme</span>
                                            <span className="text-xl font-black text-primary">{formatter.format(Number(invoice.total_amount))}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {invoice.notes && (
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 text-orange-800 text-sm">
                                        <Info className="w-5 h-5 flex-shrink-0" />
                                        <p className="leading-snug">{invoice.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div className="space-y-6">
                        <div className="glass-card p-8 !transform-none shadow-xl border-l-4 border-l-primary space-y-6 sticky top-8">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900">Zahlungsoptionen</h2>
                                <p className="text-slate-500 text-xs font-medium mt-1">Sichere Abwicklung über Stripe und PayPal</p>
                            </div>

                            {invoice.status === 'Offen' ? (
                                <div className="grid grid-cols-1 gap-4">
                                     <button 
                                        onClick={handleStripePayment}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-[#635BFF] hover:bg-[#534bb3] text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        <span>Zahlen mit Stripe</span>
                                    </button>

                                    <div className="relative py-2 flex items-center">
                                        <div className="flex-1 border-t border-slate-200"></div>
                                        <span className="px-4 text-[10px] font-bold text-slate-400 uppercase">Oder</span>
                                        <div className="flex-1 border-t border-slate-200"></div>
                                    </div>

                                    <div id="paypal-button-container" className="z-10 relative"></div>
                                    
                                    {isProcessing && (
                                        <div className="text-center py-2 animate-pulse text-[10px] font-bold text-primary uppercase tracking-widest">
                                            Verarbeitung läuft...
                                        </div>
                                    )}
                                </div>
                            ) : invoice.status === 'Bezahlt' ? (
                                <div className="space-y-4">
                                    <div className="text-center py-6 px-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-3">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                        <div className="space-y-1">
                                            <p className="font-black text-emerald-900 uppercase text-sm tracking-widest leading-none">Vollständig bezahlt</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Belegnummer: #{invoice.id}</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95">
                                        <Download className="w-5 h-5" />
                                        <span>Beleg herunterladen</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 text-center text-sm font-bold">
                                    Zahlung nicht möglich (Status: {invoice.status})
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">100% Sicher verschlüsselt</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-1 flex items-center justify-center bg-blue-600 rounded-full"></div>
                                    <p className="text-[10px] text-slate-400 font-medium">Bei Fragen kontaktieren Sie bitte unseren Support.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
