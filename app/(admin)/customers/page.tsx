'use client';

import { useState, useEffect } from 'react';
import {
    PlusCircle, Save, Search, Trash2, Edit3, X,
    Users2, Mail, Phone, Building2, MapPin
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    created_at: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '' });

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/crm/customers');
            if (res.ok) setCustomers(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const resetForm = () => {
        setForm({ name: '', email: '', phone: '', company: '', address: '' });
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editId ? `/api/crm/customers/${editId}` : '/api/crm/customers';
        const method = editId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                resetForm();
                fetchCustomers();
            }
        } catch (e) { console.error(e); }
    };

    const handleEdit = (c: Customer) => {
        setForm({
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            address: c.address || ''
        });
        setEditId(c.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Kunde wirklich loeschen?')) return;
        try {
            await fetch(`/api/crm/customers/${id}`, { method: 'DELETE' });
            fetchCustomers();
        } catch (e) { console.error(e); }
    };

    const filtered = customers.filter(c => {
        const s = search.toLowerCase();
        return !s || c.name.toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.company || '').toLowerCase().includes(s) ||
            (c.phone || '').toLowerCase().includes(s);
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Kunden
                    </h1>
                    <p className="text-muted-foreground mt-1">Kundenstamm verwalten</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Neuer Kunde
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 glass-card p-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Kunden suchen..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm py-1"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="glass-card p-6 border-l-4 border-l-primary">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-primary">
                            {editId ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
                        </h3>
                        <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Name *</label>
                            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full py-2 text-sm" placeholder="Max Mustermann" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Firma</label>
                            <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full py-2 text-sm" placeholder="Firma GmbH" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">E-Mail</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full py-2 text-sm" placeholder="max@beispiel.de" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Telefon</label>
                            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full py-2 text-sm" placeholder="+49 ..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium mb-1">Adresse</label>
                            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full py-2 text-sm" placeholder="Strasse, PLZ Ort" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={resetForm} className="btn-secondary">Abbrechen</button>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                <Save className="w-4 h-4" /> {editId ? 'Speichern' : 'Anlegen'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Customer List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Kunden...</div>
            ) : filtered.length === 0 ? (
                <div className="glass-card text-center py-12 text-muted-foreground">
                    {search ? 'Keine Kunden gefunden.' : 'Noch keine Kunden angelegt.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(c => (
                        <div key={c.id} className="glass-card p-5 border-t-4 border-t-primary flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">{c.name}</h3>
                                    {c.company && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                            <Building2 className="w-3.5 h-3.5" /> {c.company}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Bearbeiten">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors" title="Loeschen">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-muted-foreground">
                                {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {c.email}</div>}
                                {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
                                {c.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {c.address}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
