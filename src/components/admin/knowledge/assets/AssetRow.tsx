"use client";

import React from 'react';
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";
import {
    FileText, CheckCircle2, AlertCircle, Clock, RotateCw, Sparkles, Ghost, Skull, Coins, Archive
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus } from "@/types/knowledge";
import { AssetActions } from "./AssetActions";

interface AssetRowProps {
    doc: KnowledgeAsset;
    selected?: boolean;
    onSelect?: (asset: KnowledgeAsset | null) => void;
    handleStatusChange: (id: string, status: AssetStatus) => void;
    handleDelete: (id: string) => void;
    setModalState: (state: any) => void;
    refresh: () => void;
}

/**
 * AssetRow — ERA 14 Refactor
 * Individual row for the asset table, handling status badges and costs.
 */
export function AssetRow({
    doc,
    selected,
    onSelect,
    handleStatusChange,
    handleDelete,
    setModalState,
    refresh
}: AssetRowProps) {
    const t = useTranslations('knowledge_assets');

    return (
        <TableRow 
            className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 ${onSelect ? 'cursor-pointer' : ''} ${selected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`} 
            onClick={() => onSelect?.(selected ? null : doc)}
        >
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                        <FileText size={18} />
                    </div>
                    <div className="max-w-[200px]">
                        <p className="text-foreground font-semibold truncate" title={doc.filename || (doc as any).source?.filename}>
                            {doc.filename || (doc as any).source?.filename || t('table.no_filename')}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">
                            {t('table.uploaded')}: {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px] uppercase">
                        {doc.componentType}
                    </Badge>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.model}</p>
                </div>
            </TableCell>
            <TableCell>
                {doc.nextReviewDate ? (
                    <div className="flex flex-col gap-1">
                        {(() => {
                            const date = new Date(doc.nextReviewDate);
                            const now = new Date();
                            const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            let colorClass = "text-slate-500";

                            if (date < now) colorClass = "text-red-500";
                            else if (diffDays <= 7) colorClass = "text-amber-500";

                            return (
                                <span className={`text-xs font-mono font-bold ${colorClass}`}>
                                    {date.toLocaleDateString()}
                                </span>
                            );
                        })()}
                        {doc.reviewStatus === 'reviewed' && (
                            <Badge className="w-fit bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 py-0 px-1 text-[9px] uppercase">
                                {t('status.reviewed')}
                            </Badge>
                        )}
                        {doc.reviewStatus === 'snoozed' && (
                            <Badge className="w-fit bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 py-0 px-1 text-[9px] uppercase">
                                {t('status.snoozed') || 'POSPUESTA'}
                            </Badge>
                        )}
                        {new Date(doc.nextReviewDate) < new Date() && doc.reviewStatus !== 'reviewed' && (
                            <Badge className="w-fit bg-red-50 text-red-700 border-red-100 hover:bg-red-50 py-0 px-1 text-[9px] uppercase">
                                {t('status.expired')}
                            </Badge>
                        )}
                        {new Date(doc.nextReviewDate) >= new Date() &&
                            Math.ceil((new Date(doc.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7 &&
                            doc.reviewStatus !== 'reviewed' && (
                                <Badge className="w-fit bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 py-0 px-1 text-[9px] uppercase">
                                    {t('review.imminent') || 'PRÓXIMA'}
                                </Badge>
                            )}
                    </div>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )}
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    {doc.ingestionStatus === 'PENDING' && (
                        <Badge variant="secondary" className="gap-1 animate-pulse">
                            <Clock size={12} /> {t('status.pending')}
                        </Badge>
                    )}
                    {doc.ingestionStatus === 'PROCESSING' && (
                        <div className="space-y-1 w-24" aria-live="polite">
                            <div className="flex justify-between text-[10px] text-primary font-bold">
                                <span>{doc.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${doc.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {doc.ingestionStatus === 'FAILED' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1" title={doc.error}>
                            <AlertCircle size={12} /> {t('status.failed')}
                        </Badge>
                    )}
                    {doc.ingestionStatus === 'STUCK' && (
                        <Badge className="bg-amber-500 text-white border-amber-600 gap-1 animate-pulse">
                            <Ghost size={12} /> {t('status.stuck') || 'Atascado'}
                        </Badge>
                    )}
                    {doc.ingestionStatus === 'DEAD' && (
                        <Badge className="bg-slate-900 text-white border-black gap-1">
                            <Skull size={12} /> {t('status.dead') || 'Mortal'}
                        </Badge>
                    )}

                    {doc.ingestionStatus === 'PROCESSING' && (doc as any).repairPhase !== 'NONE' && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 animate-pulse">
                            <RotateCw size={12} className="animate-spin-slow" /> {t('status.repairing')}
                        </Badge>
                    )}
                    {doc.ingestionStatus === 'COMPLETED' && (doc as any).autoRepaired && (
                        <Badge className="bg-teal-50 text-teal-700 border-teal-200 gap-1">
                            <Sparkles size={12} /> {t('status.repaired')}
                        </Badge>
                    )}

                    {(!doc.ingestionStatus || doc.ingestionStatus === 'COMPLETED') && (
                        <>
                            {doc.status === 'ACTIVE' && (
                                <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200/50 gap-1 hover:bg-emerald-100/50 shadow-none">
                                    <CheckCircle2 size={12} /> {t('status.active')}
                                </Badge>
                            )}
                            {doc.status === 'ARCHIVED' && (
                                <Badge className="bg-amber-100/50 text-amber-700 border-amber-200/50 gap-1 hover:bg-amber-100/50 shadow-none">
                                    <AlertCircle size={12} /> {t('status.obsolete')}
                                </Badge>
                            )}
                            {doc.status === 'DRAFT' && (
                                <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                                    <Archive size={12} /> {t('status.archived')}
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{doc.totalChunks}</span>
                        <div className="flex-1 max-w-[30px] h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (doc.totalChunks / 1000) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    {doc.ingestionCost && (
                        <div
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50/50 w-fit px-1.5 rounded-full border border-amber-100"
                            title={t('table.cost_tooltip', { cost: doc.ingestionCost.totalUSD.toFixed(4), tokens: doc.ingestionCost.totalTokens }) || `Costo: $${doc.ingestionCost.totalUSD.toFixed(4)}`}
                        >
                            <Coins size={10} />
                            <span>${doc.ingestionCost.totalUSD.toFixed(3)}</span>
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <AssetActions
                    doc={doc}
                    handleStatusChange={handleStatusChange}
                    handleDelete={handleDelete}
                    setModalState={setModalState}
                    refresh={refresh}
                />
            </TableCell>
        </TableRow>
    );
}
