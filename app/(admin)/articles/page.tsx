'use client';

import { useState, useEffect } from 'react';
import {
    PlusCircle, Save, Search, Trash2, Edit3, X, Box
} from 'lucide-react';

interface Article {
    id: number;
    title: string;
    description: string | null;
    price: number;
    unit: string;
    created_at: string;
}

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ title: '', description: '', price: 0, unit: 'Stueck' });

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/crm/articles');
            if (res.ok) setArticles(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchArticles(); }, []);

    const resetForm = () => {
        setForm({ title: '', description: '', price: 0, unit: 'Stueck' });
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editId ? `/api/crm/articles/${editId}` : '/api/crm/articles';
        const method = editId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                resetForm();
                fetchArticles();
            }
        } catch (e) { console.error(e); }
    };

    const handleEdit = (a: Article) => {
        setForm({
            title: a.title,
            description: a.description || '',
            price: Number(a.price),
            unit: a.unit || 'Stueck'
        });
        setEditId(a.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Artikel wirklich loeschen?')) return;
        try {
            await fetch(`/api/crm/articles/${id}`, { method: 'DELETE' });
            fetchArticles();
        } catch (e) { console.error(e); }
    };

    const filtered = articles.filter(a => {
        const s = search.toLowerCase();
        return !s || a.title.toLowerCase().includes(s) ||
            (a.description || '').toLowerCase().includes(s);
    });

    const fmt = (n: number) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2 });

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Artikel
                    </h1>
                    <p className="text-muted-foreground mt-1">Artikelstamm verwalten</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Neuer Artikel
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 glass-card p-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Artikel suchen..."
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
                            {editId ? 'Artikel bearbeiten' : 'Neuen Artikel anlegen'}
                        </h3>
                        <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Titel *</label>
                            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full py-2 text-sm" placeholder="Artikelname" />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-medium mb-1">Beschreibung</label>
                            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full py-2 text-sm" placeholder="Optionale Beschreibung" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Preis (EUR) *</label>
                            <input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full py-2 text-sm" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Einheit</label>
                            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full py-2 text-sm bg-white">
                                <option value="Stueck">Stueck</option>
                                <option value="Stunde">Stunde</option>
                                <option value="Pauschal">Pauschal</option>
                                <option value="kg">kg</option>
                                <option value="m">m</option>
                                <option value="m2">m2</option>
                            </select>
                        </div>
                        <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={resetForm} className="btn-secondary">Abbrechen</button>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                <Save className="w-4 h-4" /> {editId ? 'Speichern' : 'Anlegen'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Articles Table */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Lade Artikel...</div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-primary/5 border-b border-primary/10 text-muted-foreground uppercase text-[10px] font-semibold">
                            <tr>
                                <th className="px-4 py-3">Artikel</th>
                                <th className="px-4 py-3">Beschreibung</th>
                                <th className="px-4 py-3">Einheit</th>
                                <th className="px-4 py-3 text-right">Preis</th>
                                <th className="px-4 py-3 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {search ? 'Keine Artikel gefunden.' : 'Noch keine Artikel angelegt.'}
                                </td></tr>
                            ) : filtered.map(a => (
                                <tr key={a.id} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                                    <td className="px-4 py-3 font-medium">{a.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.description || '-'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.unit}</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">{fmt(a.price)} EUR</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Bearbeiten">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors" title="Loeschen">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
