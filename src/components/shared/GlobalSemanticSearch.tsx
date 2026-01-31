"use client";

import { useState } from 'react';
import {
    Search,
    Sparkles,
    Globe2,
    ChevronRight,
    Loader2,
    BrainCircuit,
    Info,
    Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RagResult } from '@/lib/rag-service';

export function GlobalSemanticSearch() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<RagResult[]>([]);
    const [synthesis, setSynthesis] = useState('');

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch('/api/core/search/cross-vertical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
                setSynthesis(data.aiSynthesis);
            }
        } catch (error) {
            console.error("Error in cross-vertical search:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="relative max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe2 className="h-5 w-5 text-teal-600 animate-pulse" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pregunta a la red de conocimiento global (ej: fallos comunes en motores gearless)..."
                        className="block w-full pl-12 pr-32 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-lg shadow-xl"
                    />
                    <div className="absolute inset-y-2 right-2 flex items-center">
                        <Button
                            type="submit"
                            disabled={isSearching}
                            className="bg-teal-600 hover:bg-teal-700 rounded-xl px-6 font-bold shadow-lg"
                        >
                            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </Button>
                    </div>
                </form>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Datos Anonimizados</span>
                    <span className="flex items-center gap-1"><Sparkles size={12} className="text-amber-500" /> IA Cross-Vertical</span>
                </div>
            </div>

            {/* Results Section */}
            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <BrainCircuit className="h-16 w-16 text-teal-600 animate-bounce" />
                        <Sparkles className="absolute -top-2 -right-2 text-amber-500" />
                    </div>
                    <p className="mt-4 text-slate-500 font-medium">KIMI sintetizando patrones globales...</p>
                </div>
            ) : synthesis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5 duration-700">
                    <Card className="lg:col-span-2 border-none shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl bg-teal-500 w-40 h-40 rounded-full" />
                        <CardContent className="p-8 space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 gap-1 pr-3">
                                    <Sparkles size={12} /> KIMI Synthesis
                                </Badge>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Global Intelligence Insight</span>
                            </div>
                            <div className="text-lg text-slate-200 leading-relaxed font-medium italic border-l-4 border-teal-500 pl-6 py-2">
                                {synthesis}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                            <Info size={14} className="text-teal-600" /> Fuentes de Referencia
                        </h4>
                        {results.map((res, i) => (
                            <Card key={i} className="border-none shadow-lg bg-white dark:bg-slate-950 transition-all hover:translate-x-1">
                                <CardContent className="p-4 space-y-2">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                                        "{res.text}"
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                                        <Badge variant="secondary" className="text-[9px] lowercase font-mono opacity-60">
                                            {res.type}
                                        </Badge>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
