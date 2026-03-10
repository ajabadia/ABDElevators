"use client";

import React from 'react';
import { Database, FileText, Globe, Layers, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chunk } from './types';

interface ExplorerResultsProps {
    chunks: Chunk[] | null;
    isLoading: boolean;
    total: number;
    page: number;
    onPageChange: (page: number | ((p: number) => number)) => void;
    limit: number;
}

export function ExplorerResults({
    chunks,
    isLoading,
    total,
    page,
    onPageChange,
    limit
}: ExplorerResultsProps) {
    const t = useTranslations('admin_knowledge');

    if (isLoading) {
        return (
            <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground transition-colors duration-300">{t('view.loading')}</p>
            </div>
        );
    }

    if (!chunks || chunks.length === 0) {
        return (
            <div className="py-20 text-center bg-muted/30 rounded-lg border border-border border-dashed">
                <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">{t('view.empty_title')}</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">{t('view.empty_subtitle')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{t('view.showing', { count: chunks.length, total: total ?? 0 })}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {chunks.map((chunk) => (
                    <Card key={chunk._id} className={`overflow-hidden transition-all hover:shadow-md bg-card ${chunk.isShadow ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/10 dark:bg-indigo-950/5' : 'border-border'}`}>
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                {/* Metadata Sidebar */}
                                <div className={`p-4 md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r transition-colors duration-300 ${chunk.isShadow ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900' : 'bg-muted/30 border-border'}`}>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={chunk.isShadow ? "secondary" : "outline"} className={chunk.isShadow ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900" : "bg-card"}>
                                                {chunk.isShadow ? (
                                                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {t('view.chunk_shadow')}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {t('view.chunk_original')}</span>
                                                )}
                                            </Badge>
                                            <Badge variant="outline" className="bg-card">
                                                <Globe className="w-3 h-3 mr-1" /> {chunk.language?.toUpperCase() || 'N/A'}
                                            </Badge>
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p className="font-semibold text-foreground truncate" title={chunk.sourceDoc}>{chunk.sourceDoc}</p>
                                            <p>{t('view.chunk_model')}: <span className="font-mono text-foreground">{chunk.model}</span></p>
                                            <p>{t('view.chunk_type')}: {chunk.componentType}</p>
                                            <p className="pt-2 border-t border-border mt-2">
                                                {chunk.createdAt ? format(new Date(chunk.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : 'N/A'}
                                            </p>
                                        </div>

                                        {chunk.isShadow && (
                                            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded p-2 text-xs text-indigo-800 dark:text-indigo-300">
                                                <p className="font-bold">{t('view.auto_trans')}</p>
                                                <p>{t('view.chunk_original')}: {chunk.originalLang?.toUpperCase()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1">
                                    <div className="relative group">
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/10 p-3 rounded border border-border shadow-sm">
                                            {chunk.chunkText ? (chunk.chunkText.length > 500 ? `${chunk.chunkText.substring(0, 500)}...` : chunk.chunkText) : ''}
                                        </p>
                                        {chunk.chunkType === 'VISUAL' && (
                                            <div className="absolute top-2 right-2">
                                                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                                    <ImageIcon size={10} /> Esquema Visual
                                                </Badge>
                                            </div>
                                        )}
                                        {chunk.approxPage && (
                                            <div className="absolute bottom-2 right-2">
                                                <span className="text-[10px] font-bold text-muted-foreground/50 bg-card/80 px-1 rounded">
                                                    Pág {chunk.approxPage}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {chunk.isShadow && (
                                        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900">
                                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">{t('view.dual_mechanism')}:</p>
                                            <p className="text-xs text-muted-foreground">{t('view.dual_desc')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center rounded-b-xl">
                <p className="text-xs text-muted-foreground"> {t('view.showing', { count: chunks.length, total: total ?? 0 })}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => onPageChange((p: number) => Math.max(1, p - 1))}
                        aria-label={t('view.prev')}
                    >
                        {t('view.prev')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={((page) * limit) >= (total || 0)}
                        onClick={() => onPageChange((p: number) => p + 1)}
                        aria-label={t('view.next')}
                    >
                        {t('view.next')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
