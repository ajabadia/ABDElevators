"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Filter, FileText, CheckCircle2,
    AlertCircle, Clock, Trash2, Download, MoreVertical,
    Archive, ShieldOff, RotateCw, Link2, Eye, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UnifiedIngestModal } from "@/components/admin/knowledge/UnifiedIngestModal";
import { PDFPreviewModal } from "@/components/admin/knowledge/PDFPreviewModal";
import { RelationshipManagerModal } from "@/components/admin/knowledge/RelationshipManagerModal";
import { IngestionDiagnosticModal } from "@/components/admin/knowledge/IngestionDiagnosticModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { logClientEvent } from "@/lib/logger-client";

import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Layers, Database, History } from "lucide-react";

import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus, IngestionStatus } from "@/types/knowledge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface KnowledgeAssetsManagerProps {
    scope?: 'all' | 'user';
    userId?: string;
}

export function KnowledgeAssetsManager({ scope = 'all', userId }: KnowledgeAssetsManagerProps) {
    const { toast } = useToast();
    const t = useTranslations('knowledge_assets');
    const tCommon = useTranslations('common');
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State Refactor (Audit Item 3.2)
    type ModalState =
        | { type: 'closed' }
        | { type: 'upload' }
        | { type: 'preview', id: string, filename: string }
        | { type: 'relationship', asset: KnowledgeAsset }
        | { type: 'diagnostic', id: string, filename: string };

    const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });

    // Pagination state
    const [page, setPage] = useState(1);
    const limit = 10;

    // 1. Fetching with useApiList
    const {
        data: documents,
        isLoading,
        refresh,
        setData,
        total
    } = useApiList<KnowledgeAsset>({
        endpoint: '/api/admin/knowledge-assets',
        filters: {
            search: searchTerm,
            skip: (page - 1) * limit,
            limit: limit,
            scope: scope,
            userId: userId
        },
        dataKey: 'assets'
    });

    // Reset to page 1 on search
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil((total || 0) / limit);

    // ... perceptual optimization ...
    const { updateOptimistic, deleteOptimistic } = useApiOptimistic(documents, setData);

    // 3. Mutations
    const statusMutation = useApiMutation({
        endpoint: '/api/admin/knowledge-assets/status',
        method: 'PATCH',
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'INFO',
                source: 'UI_DOCS',
                action: 'STATUS_CHANGE',
                message: 'Document status updated',
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/admin/knowledge-assets/${id}`,
        method: 'DELETE',
        confirmMessage: (id) => t('delete_confirm'),
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'WARN',
                source: 'UI_DOCS',
                action: 'DELETE_DOC',
                message: 'Document deleted from corpus',
            });
        }
    });

    const handleStatusChange = async (documentId: string, newStatus: AssetStatus) => {
        updateOptimistic(documentId, { status: newStatus });
        try {
            await statusMutation.mutate({ documentId, status: newStatus });
        } catch (error) {
            refresh();
        }
    };

    const handleDelete = async (documentId: string) => {
        const originalData = [...documents];
        deleteOptimistic(documentId);
        try {
            await deleteMutation.mutate(documentId);
        } catch (error) {
            setData(originalData);
        }
    };

    // 4. Adaptive Polling Optimization (Audit Item 2)
    useEffect(() => {
        const processingItems = documents.filter(d =>
            d.ingestionStatus === 'PROCESSING' ||
            d.ingestionStatus === 'PENDING'
        );

        if (processingItems.length > 0) {
            // Incremental polling strategy: 3s + 1s per processing item, max 10s
            const intervalMs = Math.min(3000 + (processingItems.length * 1000), 10000);
            const interval = setInterval(refresh, intervalMs);
            return () => clearInterval(interval);
        }
    }, [documents, refresh]);

    const stats = {
        active: documents.filter(d => ['vigente', 'active'].includes(d.status)).length,
        totalChunks: documents.reduce((acc, d) => acc + (d.totalChunks || 0), 0),
        lastIngest: documents.length > 0 ? new Date(documents[0].createdAt).toLocaleString() : '-'
    };

    return (
        <div className="space-y-6">
            <UnifiedIngestModal
                isOpen={modalState.type === 'upload'}
                onClose={() => {
                    setModalState({ type: 'closed' });
                    refresh();
                }}
            />

            <PDFPreviewModal
                isOpen={modalState.type === 'preview'}
                onClose={() => setModalState({ type: 'closed' })}
                id={modalState.type === 'preview' ? modalState.id : ""}
                filename={modalState.type === 'preview' ? modalState.filename : ""}
            />

            <RelationshipManagerModal
                isOpen={modalState.type === 'relationship'}
                onClose={() => {
                    setModalState({ type: 'closed' });
                    refresh();
                }}
                asset={modalState.type === 'relationship' ? modalState.asset : null as any}
            />

            <IngestionDiagnosticModal
                isOpen={modalState.type === 'diagnostic'}
                onClose={() => setModalState({ type: 'closed' })}
                assetId={modalState.type === 'diagnostic' ? modalState.id : ""}
                filename={modalState.type === 'diagnostic' ? modalState.filename : ""}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title={t('metrics.active')}
                    value={stats.active}
                    icon={<Layers className="w-5 h-5" />}
                    color="primary"
                />
                <MetricCard
                    title={t('metrics.indexed')}
                    value={stats.totalChunks}
                    icon={<Database className="w-5 h-5" />}
                    color="primary"
                />
                <MetricCard
                    title={t('metrics.last_ingest')}
                    value={stats.lastIngest}
                    icon={<History className="w-5 h-5" />}
                    color="primary"
                />
            </div>

            <ContentCard>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" size={18} />
                        <Input
                            type="search"
                            role="searchbox"
                            aria-label={t('search_placeholder')}
                            placeholder={t('search_placeholder')}
                            className="pl-10 border-border focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setModalState({ type: 'upload' })}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-6"
                    >
                        <Plus size={18} />
                        {t('actions.new')}
                    </Button>
                </div>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[35%] font-bold text-foreground">{t('table.document')}</TableHead>
                                <TableHead className="w-[20%] font-bold text-foreground">{t('table.type_model')}</TableHead>
                                <TableHead className="w-[15%] font-bold text-foreground">{t('table.status')}</TableHead>
                                <TableHead className="w-[15%] font-bold text-foreground">{t('table.chunks')}</TableHead>
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
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        {t('table.empty')}
                                    </TableCell>
                                </TableRow>
                            ) : documents.map((doc) => (
                                <TableRow key={doc._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded text-slate-500">
                                                <FileText size={18} />
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="text-foreground font-semibold truncate" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">
                                                    {t('table.uploaded')}: {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase">
                                                {doc.componentType}
                                            </Badge>
                                            <p className="text-xs font-bold text-slate-700">{doc.model}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[15%]">
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

                                            {(!doc.ingestionStatus || doc.ingestionStatus === 'COMPLETED') && (
                                                <>
                                                    {['vigente', 'active'].includes(doc.status) && (
                                                        <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200/50 gap-1 hover:bg-emerald-100/50 shadow-none">
                                                            <CheckCircle2 size={12} /> {t('status.active')}
                                                        </Badge>
                                                    )}
                                                    {['obsoleto', 'obsolete'].includes(doc.status) && (
                                                        <Badge className="bg-amber-100/50 text-amber-700 border-amber-200/50 gap-1 hover:bg-amber-100/50 shadow-none">
                                                            <AlertCircle size={12} /> {t('status.obsolete')}
                                                        </Badge>
                                                    )}
                                                    {['archivado', 'archived'].includes(doc.status) && (
                                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                                                            <Archive size={12} /> {t('status.archived')}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[15%]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">{doc.totalChunks}</span>
                                            <div className="flex-1 max-w-[40px] h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="bg-primary h-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (doc.totalChunks / 1000) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionsMenu
                                            doc={doc}
                                            t={t}
                                            handleStatusChange={handleStatusChange}
                                            handleDelete={handleDelete}
                                            onPreview={() => setModalState({ type: 'preview', id: doc._id, filename: doc.filename })}
                                            onManageRelationships={() => setModalState({ type: 'relationship', asset: doc })}
                                            onViewDiagnostics={() => setModalState({ type: 'diagnostic', id: doc._id, filename: doc.filename })}
                                            refresh={refresh}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 border-t border-border pt-6">
                        <p className="text-xs text-muted-foreground">
                            {tCommon('pagination.total_items', { total: total || 0 })}
                        </p>
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                {tCommon('pagination.page_info', { current: page, total: totalPages })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                    aria-label={tCommon('pagination.previous_page') || 'Previous Page'}
                                >
                                    <ChevronLeft size={14} aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isLoading}
                                    aria-label={tCommon('pagination.next_page') || 'Next Page'}
                                >
                                    <ChevronRight size={14} aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </ContentCard>
        </div>
    );
}

function ActionsMenu({ doc, t, handleStatusChange, handleDelete, onPreview, onManageRelationships, onViewDiagnostics, refresh }: any) {
    const { toast } = useToast();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-slate-100">
                <DropdownMenuLabel className="text-xs text-slate-400">{t('table.actions')}</DropdownMenuLabel>
                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-teal-600 focus:text-teal-600 focus:bg-teal-50"
                    onClick={onPreview}
                >
                    <Eye size={14} /> {t('actions.preview') || 'Ver Transcripción/PDF'}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/5"
                    onClick={onViewDiagnostics}
                >
                    <Activity size={14} /> {t('actions.diagnostics') || 'Ver Diagnóstico de Ingesta'}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer"
                    onClick={onManageRelationships}
                >
                    <Link2 size={14} /> {t('actions.relationships') || 'Vincular Documentos'}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer"
                    onClick={() => window.open(`/api/admin/knowledge-assets/${doc._id}/download`, '_blank')}
                >
                    <Download size={14} /> {t('actions.download')}
                </DropdownMenuItem>

                {(doc.ingestionStatus === 'FAILED' || doc.ingestionStatus === 'PENDING') && (
                    <DropdownMenuItem
                        className="rounded-lg gap-2 cursor-pointer text-teal-600 focus:text-teal-600 focus:bg-teal-50"
                        onClick={async () => {
                            try {
                                const res = await fetch(`/api/admin/knowledge-assets/${doc._id}/retry`, { method: 'POST' });
                                if (!res.ok) throw new Error('Retry failed');
                                toast({ title: t('retry_success'), description: t('retry_desc') });
                                refresh();
                            } catch (err) {
                                toast({ variant: "destructive", title: "Error", description: "Retry failed" });
                            }
                        }}
                    >
                        <RotateCw size={14} /> {t('actions.retry')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-slate-50" />
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
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem
                    onClick={() => handleDelete(doc._id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg gap-2 cursor-pointer"
                >
                    <Trash2 size={14} /> {t('actions.delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
