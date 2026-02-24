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
    Shield,
    Image as ImageIcon,
    Settings2
} from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RagResult } from '@/services/core/RagService';
import { useTranslations } from 'next-intl';
import { humanizeConfidence, confidencePercent } from '@/lib/confidence-humanizer';
import AnswerFeedback from '@/components/shared/AnswerFeedback';

/**
 * GlobalSemanticSearch — ERA 6 Core Flow (FASE 192)
 * 
 * Simplified search interface with cross-vertical intelligence.
 * Includes scope selection (Company, My Space, Manuals) and 
 * progressive disclosure for advanced RAG metrics.
 */
export function GlobalSemanticSearch() {
    const t = useTranslations('common');
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<'company' | 'space' | 'manuals'>('company');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<RagResult[]>([]);
    const [synthesis, setSynthesis] = useState('');
    const [showExpertOptions, setShowExpertOptions] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch('/api/core/search/cross-vertical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    scope
                })
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Search Bar & Scope */}
            <div className="max-w-3xl mx-auto space-y-6">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe2 className="h-5 w-5 text-primary opacity-70" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("navigation.search.placeholder")}
                        className="block w-full pl-12 pr-32 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-lg shadow-xl outline-none"
                    />
                    <div className="absolute inset-y-2.5 right-2.5 flex items-center">
                        <Button
                            type="submit"
                            disabled={isSearching}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold shadow-lg h-12"
                        >
                            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </Button>
                    </div>
                </form>

                {/* Scope Selector (Simplificado) */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {(['company', 'space', 'manuals'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setScope(s)}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                    scope === s
                                        ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t(`searchScope.${s}`)}
                            </button>
                        ))}
                    </div>

                    {/* Expert Mode Toggle */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <span className="flex items-center gap-1"><Shield size={12} className="text-primary" /> Datos Anonimizados</span>
                            <span className="flex items-center gap-1"><Sparkles size={12} className="text-amber-500" /> IA {scope === 'company' ? 'Global' : 'Aislada'}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowExpertOptions(!showExpertOptions)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors tracking-widest border-l border-slate-200 pl-4"
                        >
                            <Settings2 size={12} />
                            {t("expertMode.toggle")}
                        </button>
                    </div>
                </div>

                {/* Expert Mode Content */}
                {showExpertOptions && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t("expertMode.subtitle")}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">Algoritmo</label>
                                <Badge variant="outline" className="text-[10px] py-0">Híbrido (Vector + Keyword)</Badge>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">Modelo</label>
                                <Badge variant="outline" className="text-[10px] py-0">Gemini-2.0-Flash</Badge>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <BrainCircuit className="h-16 w-16 text-primary animate-bounce opacity-70" />
                        <Sparkles className="absolute -top-2 -right-2 text-amber-500" />
                    </div>
                    <p className="mt-4 text-slate-500 font-medium">Sintetizando patrones globales...</p>
                </div>
            ) : synthesis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ContentCard className="lg:col-span-2 border-none shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white overflow-hidden relative" noPadding>
                        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl bg-primary w-40 h-40 rounded-full" />
                        <div className="p-8 space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 pr-3">
                                    <Sparkles size={12} /> AI Synthesis
                                </Badge>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Global Intelligence Insight</span>
                            </div>
                            <div className="text-lg text-slate-200 leading-relaxed font-medium italic border-l-4 border-primary pl-6 py-2">
                                {synthesis}
                            </div>
                            <AnswerFeedback
                                answerId={`synth-${crypto.randomUUID()}`}
                                question={query}
                                documentSource="Cross-Vertical RAG"
                                className="border-t-slate-800/50 mt-4"
                            />
                        </div>
                    </ContentCard>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                            <Info size={14} className="text-primary" /> Fuentes de Referencia
                        </h4>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {results.map((res, i) => (
                                <SearchSourceCard key={i} res={res} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SearchSourceCard({ res }: { res: RagResult }) {
    const t = useTranslations('common');
    const [expanded, setExpanded] = useState(false);
    const conf = res.score != null ? humanizeConfidence(res.score) : null;

    return (
        <ContentCard className="shadow-lg hover:translate-x-1 transition-all border border-slate-100 dark:border-slate-800" noPadding>
            <div className="p-4 space-y-2 text-left">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 min-w-0">
                        <span className="truncate">{res.source}</span>
                        {res.approxPage && ` • Pág ${res.approxPage}`}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {conf && (
                            <span className={cn("text-[9px] font-bold", conf.colorClass)}>
                                {conf.icon} {confidencePercent(res.score!)}%
                            </span>
                        )}
                        {res.chunkType === 'VISUAL' && (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none px-1.5 py-0 h-4 text-[9px] font-black">
                                <ImageIcon size={10} className="mr-1" /> ESQUEMA
                            </Badge>
                        )}
                    </div>
                </div>

                <p className={cn(
                    "text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-slate-50 dark:border-slate-800 pl-3 py-1",
                    !expanded && "line-clamp-3"
                )}>
                    "{res.text}"
                </p>

                {res.text.length > 150 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        onPointerDown={(e) => e.preventDefault()}
                        className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-0.5 tracking-widest pl-3"
                    >
                        {expanded ? "Ver menos" : t("expertMode.moreContext")}
                    </button>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 lowercase font-mono opacity-60">
                        {res.type}
                    </Badge>
                    {res.cloudinaryUrl && (
                        <a href={res.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronRight size={14} className="text-primary hover:scale-125 transition-transform" />
                        </a>
                    )}
                </div>
            </div>
        </ContentCard>
    );
}
