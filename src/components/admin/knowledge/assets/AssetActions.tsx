"use client";

import React from 'react';
import {
    MoreVertical, Eye, Sparkles, Zap, Database, Activity, FolderPlus, Link2, Download, CalendarCheck, Clock, RotateCw, CheckCircle2, AlertCircle, Archive, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus } from "@/types/knowledge";

interface AssetActionsProps {
    doc: KnowledgeAsset;
    handleStatusChange: (id: string, status: AssetStatus) => void;
    handleDelete: (id: string) => void;
    setModalState: (state: any) => void;
    refresh: () => void;
}

/**
 * AssetActions — ERA 14 Refactor
 * Dropdown menu for managing an individual asset.
 */
export function AssetActions({
    doc,
    handleStatusChange,
    handleDelete,
    setModalState,
    refresh
}: AssetActionsProps) {
    const t = useTranslations('knowledge_assets');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-slate-100 dark:border-slate-800">
                <DropdownMenuLabel className="text-xs text-slate-400">{t('table.actions')}</DropdownMenuLabel>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-teal-600 focus:text-teal-600 focus:bg-teal-50 dark:focus:bg-teal-950/30"
                    onClick={() => setModalState({ type: 'preview', id: doc._id, filename: doc.filename })}
                >
                    <Eye size={14} /> {t('actions.preview') || 'Ver Transcripción/PDF'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-950/30 font-bold"
                    onClick={() => setModalState({ type: 'analyze', asset: doc })}
                    disabled={doc.ingestionStatus !== 'COMPLETED'}
                >
                    <Sparkles size={14} /> {t('actions.analyze') || 'Analizar/Consultar'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30"
                    onClick={() => setModalState({ type: 'enrich', asset: doc })}
                    disabled={doc.ingestionStatus !== 'COMPLETED'}
                >
                    <Zap size={14} /> {t('actions.enrich')}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/30"
                    onClick={() => setModalState({ type: 'chunks', asset: doc })}
                    disabled={doc.totalChunks === 0}
                >
                    <Database size={14} /> {t('actions.view_chunks') || 'Ver Chunks Ingestados'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/5 dark:focus:bg-primary/10"
                    onClick={() => setModalState({ type: 'diagnostic', id: doc._id, filename: doc.filename })}
                >
                    <Activity size={14} /> {t('actions.diagnostics') || 'Ver Diagnóstico de Ingesta'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer transition-colors duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                    onClick={() => setModalState({ type: 'spaces', asset: doc })}
                >
                    <FolderPlus size={14} /> {t('actions.manage_spaces') || 'Mover/Gestionar Espacios'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer"
                    onClick={() => setModalState({ type: 'relationship', asset: doc })}
                >
                    <Link2 size={14} /> {t('actions.relationships') || 'Vincular Documentos'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer"
                    onClick={() => window.open(`/api/admin/knowledge-assets/${doc._id}/download`, '_blank')}
                >
                    <Download size={14} /> {t('actions.download')}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                <DropdownMenuLabel className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-widest font-bold">{t('review.next_date')}</DropdownMenuLabel>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-950/30"
                    onClick={() => setModalState({ type: 'review', asset: doc })}
                >
                    <CalendarCheck size={14} /> {t('actions.mark_reviewed')}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30"
                    onClick={async () => {
                        try {
                            const res = await fetch(`/api/admin/knowledge-assets/${doc._id}/review`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'snooze' })
                            });
                            if (!res.ok) throw new Error();
                            toast.success(t('snooze_success') || 'Snoozed');
                            refresh();
                        } catch (err) {
                            toast.error('Error');
                        }
                    }}
                >
                    <Clock size={14} /> {t('actions.snooze_review')}
                </DropdownMenuItem>

                {(doc.ingestionStatus === 'FAILED' || doc.ingestionStatus === 'PENDING' || (doc.ingestionStatus === 'COMPLETED' && (doc.totalChunks || 0) === 0)) && (
                    <DropdownMenuItem
                        className="rounded-lg gap-2 cursor-pointer text-teal-600 dark:text-teal-400 focus:text-teal-600 focus:bg-teal-50 dark:focus:bg-teal-950/30"
                        onClick={async () => {
                            try {
                                const res = await fetch(`/api/admin/knowledge-assets/${doc._id}/retry`, { method: 'POST' });
                                if (!res.ok) throw new Error('Retry failed');
                                toast.success(t('retry_success'), { description: t('retry_desc') });
                                refresh();
                            } catch (err) {
                                toast.error("Error", { description: "Retry failed" });
                            }
                        }}
                    >
                        <RotateCw size={14} /> {t('actions.retry')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                <DropdownMenuLabel className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-widest font-bold">{t('table.status')}</DropdownMenuLabel>

                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleStatusChange(doc._id, 'vigente')}>
                    <CheckCircle2 size={14} className="text-emerald-500" /> {t('actions.mark_active')}
                </DropdownMenuItem>

                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleStatusChange(doc._id, 'obsoleto')}>
                    <AlertCircle size={14} className="text-amber-500" /> {t('actions.mark_obsolete')}
                </DropdownMenuItem>

                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleStatusChange(doc._id, 'archivado')}>
                    <Archive size={14} className="text-slate-400" /> {t('actions.archive')}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                <DropdownMenuItem
                    onClick={() => handleDelete(doc._id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-lg gap-2 cursor-pointer"
                >
                    <Trash2 size={14} /> {t('actions.delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
