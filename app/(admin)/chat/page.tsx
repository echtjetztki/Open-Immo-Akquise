'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, Clock, Loader2, MessageSquare, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Chat {
    id: number;
    question: string;
    answer: string;
    created_at: string;
}

export default function ChatPage() {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [error, setError] = useState('');
    const [provider, setProvider] = useState<'mistral' | 'gemini'>('gemini');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (err) {
            console.error('Failed to fetch chats');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError('');

        const currentQuestion = question;
        setQuestion('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    provider: provider
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.details || data.error || 'Fehler bei der Anfrage');
            }

            const newChat = await res.json();
            setChats(prev => [newChat, ...prev]);
        } catch (err: any) {
            setError(err.message);
            setQuestion(currentQuestion); // Restore if failed
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text: string, id: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            KI Assistent
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Stelle Fragen, um optimale Antworten für Kunden zu generieren.
                        </p>
                    </div>
                </div>

                {/* Provider Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setProvider('mistral')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${provider === 'mistral'
                            ? 'bg-white shadow-sm text-primary'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Mistral AI
                    </button>
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${provider === 'gemini'
                            ? 'bg-white shadow-sm text-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Gemini Flash
                    </button>
                </div>
            </div>

            {/* Input Section */}
            <div className="glass-card p-6 border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <form onSubmit={handleSubmit} className="relative z-10">
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Frage stellen..."
                            className="input-field min-h-[120px] resize-y p-4 text-base"
                            disabled={loading}
                        />
                        {error && (
                            <p className="text-error text-sm px-2 text-red-500 font-medium">{error}</p>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className={`btn-primary flex items-center gap-2 group px-6 transition-all ${provider === 'gemini' ? 'from-teal-600 to-blue-600' : ''
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Die KI denkt nach...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                        <span>Frage stellen</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2 px-2 text-foreground/80 mt-8">
                    <Clock className="w-5 h-5" />
                    Archiv der Fragen
                </h3>

                <AnimatePresence>
                    {chats.map((chat) => (
                        <motion.div
                            key={chat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card overflow-hidden border border-primary/10"
                        >
                            <div className="p-5 bg-background border-b border-primary/5 flex gap-4">
                                <div className="shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{chat.question}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(chat.created_at).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 bg-gradient-to-br from-primary/5 to-transparent flex gap-4 relative group/item">
                                <div className="shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{chat.answer}</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(chat.answer, chat.id)}
                                    className="absolute top-4 right-4 p-2 rounded-lg bg-white shadow-sm border border-primary/10 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-primary/5"
                                    title="Antwort kopieren"
                                >
                                    {copiedId === chat.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {chats.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/20 rounded-2xl">
                        Noch keine Fragen im Archiv.
                    </div>
                )}
            </div>
        </div>
    );
}
