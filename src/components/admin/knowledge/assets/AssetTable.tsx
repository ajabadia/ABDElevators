"use client";

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus } from "@/types/knowledge";
import { AssetRow } from "./AssetRow";

interface AssetTableProps {
    documents: KnowledgeAsset[];
    isLoading: boolean;
    onSelect?: (asset: KnowledgeAsset | null) => void;
    selectedAssetId?: string;
    onNewAsset: () => void;
    handleStatusChange: (id: string, status: AssetStatus) => void;
    handleDelete: (id: string) => void;
    setModalState: (state: any) => void;
    refresh: () => void;
}

/**
 * AssetTable — ERA 14 Refactor
 * Renders the asset list table with loading and empty states.
 */
export function AssetTable({
    documents,
    isLoading,
    onSelect,
    selectedAssetId,
    onNewAsset,
    handleStatusChange,
    handleDelete,
    setModalState,
    refresh
}: AssetTableProps) {
    const t = useTranslations('knowledge_assets');

    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="w-[30%] font-bold text-foreground">{t('table.document')}</TableHead>
                        <TableHead className="w-[15%] font-bold text-foreground">{t('table.type_model')}</TableHead>
                        <TableHead className="w-[15%] font-bold text-foreground">{t('review.next_date')}</TableHead>
                        <TableHead className="w-[15%] font-bold text-foreground">{t('table.status')}</TableHead>
                        <TableHead className="w-[10%] font-bold text-foreground">{t('table.chunks')}</TableHead>
                        <TableHead className="w-[15%] font-bold text-foreground text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                {t('table.loading')}
                            </TableCell>
                        </TableRow>
                    ) : documents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20">
                                <div className="flex flex-col items-center justify-center max-w-[400px] mx-auto space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-full text-primary animate-pulse">
                                        <Database size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-foreground">
                                            {t('empty.title') || 'Tu Corpus está Vacío'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {t('empty.description') || 'Comienza subiendo especificaciones técnicas o manuales para que la IA pueda empezar a aprender de tu conocimiento.'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={onNewAsset}
                                        variant="outline"
                                        className="mt-2 border-primary/20 hover:bg-primary/5 text-primary gap-2"
                                    >
                                        <Plus size={16} />
                                        {t('actions.upload_first') || 'Subir mi Primer Documento'}
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : documents.map((doc) => (
                        <AssetRow
                            key={doc._id}
                            doc={doc}
                            selected={selectedAssetId === doc._id}
                            onSelect={onSelect}
                            handleStatusChange={handleStatusChange}
                            handleDelete={handleDelete}
                            setModalState={setModalState}
                            refresh={refresh}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
