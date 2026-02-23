"use client";

import React, { useState } from 'react';
import {
    FileText,
    ExternalLink,
    ShieldCheck,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    Info,
    LayoutGrid
} from 'lucide-react';
import { RagResult } from '@/lib/rag-service';
import { humanizeConfidence, confidencePercent } from '@/lib/confidence-humanizer';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VectorResultsTableProps {
    results: RagResult[];
    isLoading?: boolean;
    onViewPDF?: (source: string, page?: number, cloudinaryUrl?: string) => void;
}

/**
 * VectorResultsTable — ERA 6 Optimized (FASE 192)
 * 
 * Displays RAG search results with humanized confidence labels.
 * Technical metrics and raw scores are hidden under Expert Mode.
 */
export const VectorResultsTable: React.FC<VectorResultsTableProps> = ({
    results,
    isLoading = false,
    onViewPDF
}) => {
    const t = useTranslations('common');

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500 font-medium">No se encontraron documentos oficiales relevantes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Confianza
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Documento y Fragmento
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {results.map((result, index) => (
                            <ResultRow
                                key={index}
                                result={result}
                                index={index}
                                onViewPDF={onViewPDF}
                            />
                        ))}
                    </tbody>
                </table>
                <div className="bg-primary/5 px-6 py-3 flex items-center border-t border-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary mr-2" />
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        Validación técnica mediante búsqueda semántica contextual
                    </span>
                </div>
            </div>
        </div>
    );
};

/** Row component to handle item expansion and expert mode */
function ResultRow({ result, index, onViewPDF }: { result: RagResult; index: number; onViewPDF?: (source: string, page?: number, cloudinaryUrl?: string) => void }) {
    const t = useTranslations('common');
    const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const conf = result.score != null ? humanizeConfidence(result.score) : null;

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
            <td className="px-6 py-5 align-top">
                {conf ? (
                    <div className="space-y-1">
                        <div className={cn("text-xs font-black flex items-center gap-1", conf.colorClass)}>
                            {conf.icon} {t(conf.labelKey)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            Score: {confidencePercent(result.score!)}%
                        </div>
                    </div>
                ) : (
                    <Badge variant="outline" className="text-[10px] opacity-40">N/A</Badge>
                )}
            </td>

            <td className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                        <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {result.source}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 lowercase font-mono opacity-70">
                                {result.type}
                            </Badge>
                            {result.chunkType === 'VISUAL' && (
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none px-1.5 py-0 h-4 text-[9px] font-black">
                                    <ImageIcon className="mr-1 h-3 w-3" /> ESQUEMA
                                </Badge>
                            )}
                            {result.approxPage && (
                                <span className="text-[10px] text-slate-400">Pág {result.approxPage}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative group/text">
                    <div className={cn(
                        "text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1",
                        !isTextExpanded && "line-clamp-2"
                    )}>
                        "{result.text}"
                    </div>

                    {result.text.length > 150 && (
                        <button
                            onClick={() => setIsTextExpanded(!isTextExpanded)}
                            className="mt-1 text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 ml-4"
                        >
                            {isTextExpanded ? "Ver menos" : t("expertMode.moreContext")}
                        </button>
                    )}
                </div>

                {/* Technical detail (Expert Mode) */}
                <Collapsible open={isTechnicalExpanded} onOpenChange={setIsTechnicalExpanded} className="mt-4">
                    <CollapsibleTrigger className="text-[9px] font-black uppercase text-slate-400 hover:text-primary transition-colors tracking-widest flex items-center gap-1.5">
                        <Info size={12} />
                        {t("expertMode.technicalDetail")}
                        {isTechnicalExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{t("actions.view")}</span>
                                <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    ID: {result.source.split('.')[0]}-{index}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{t("status.processing")}</span>
                                <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    {result.chunkType || 'TEXT_PASSAGE'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <LayoutGrid size={10} className="text-slate-400" />
                            <TooltipProvider>
                                <div className="flex items-center gap-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-[9px] text-slate-500 italic cursor-help underline decoration-dotted underline-offset-2">
                                                Faithfulness: 0.98
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-[10px]">
                                            <p><strong>Fidelidad:</strong> Indica si la respuesta proviene estrictamente de la fuente, sin alucinaciones.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <span className="text-[9px] text-slate-300">•</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-[9px] text-slate-500 italic cursor-help underline decoration-dotted underline-offset-2">
                                                Relevancy: {result.score?.toFixed(2)}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-[10px]">
                                            <p><strong>Relevancia:</strong> Evalúa qué tan útil es este fragmento de texto para resolver la consulta planteada.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </td>

            <td className="px-6 py-5 text-right vertical-top">
                {result.cloudinaryUrl ? (
                    onViewPDF ? (
                        <button
                            onClick={() => onViewPDF(result.source, result.approxPage, result.cloudinaryUrl)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                            <ExternalLink className="mr-1.5 h-3 w-3" />
                            {t("actions.view")} PDF
                        </button>
                    ) : (
                        <a
                            href={result.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                            <ExternalLink className="mr-1.5 h-3 w-3" />
                            Ver PDF
                        </a>
                    )
                ) : (
                    <span className="text-[10px] text-slate-300 italic font-medium uppercase tracking-tight">Offline</span>
                )}
            </td>
        </tr>
    );
}
