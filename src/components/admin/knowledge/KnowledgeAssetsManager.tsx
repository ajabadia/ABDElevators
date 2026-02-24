"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, FileText, CheckCircle2,
    AlertCircle, Clock, Trash2, Download, MoreVertical,
    Archive, RotateCw, Link2, Eye, Activity,
    CalendarCheck, Info, Sparkles, Skull, Ghost, Coins, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedIngestModal } from "@/components/admin/knowledge/UnifiedIngestModal";
import { EnrichmentModal } from "@/components/admin/knowledge/EnrichmentModal";
import { PDFPreviewModal } from "@/components/admin/knowledge/PDFPreviewModal";
import { RelationshipManagerModal } from "@/components/admin/knowledge/RelationshipManagerModal";
import { IngestionDiagnosticModal } from "@/components/admin/knowledge/IngestionDiagnosticModal";
import { QuickAnalyzeModal } from "@/components/admin/knowledge/QuickAnalyzeModal";
import { ChunksViewModal } from "@/components/admin/knowledge/ChunksViewModal";
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
import { toast } from "sonner";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { logClientEvent } from "@/lib/logger-client";

import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Layers, Database, History } from "lucide-react";

import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus } from "@/types/knowledge";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

interface KnowledgeAssetsManagerProps {
    scope?: 'all' | 'user';
    userId?: string;
}

export function KnowledgeAssetsManager({ scope = 'all', userId }: KnowledgeAssetsManagerProps) {

    const t = useTranslations('knowledge_assets');
    const tCommon = useTranslations('common');
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [reviewFilter, setReviewFilter] = useState<string>("all");

    // Modal State Refactor
    type ModalState =
        | { type: 'closed' }
        | { type: 'upload' }
        | { type: 'preview', id: string, filename: string }
        | { type: 'relationship', asset: KnowledgeAsset }
        | { type: 'diagnostic', id: string, filename: string }
        | { type: 'review', asset: KnowledgeAsset }
        | { type: 'analyze', asset: KnowledgeAsset }
        | { type: 'enrich', asset: KnowledgeAsset }
        | { type: 'chunks', asset: KnowledgeAsset };

    const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });
    const [reviewDate, setReviewDate] = useState<string>(format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"));

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
            userId: userId,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            reviewStatus: reviewFilter !== 'all' ? reviewFilter : undefined
        },
        dataKey: 'assets'
    });

    const handleReviewSubmit = async () => {
        if (modalState.type !== 'review') return;
        try {
            const res = await fetch(`/api/admin/knowledge-assets/${modalState.asset._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nextReviewDate: reviewDate })
            });

            if (!res.ok) throw new Error("Review update failed");

            toast.success(t('review.success'));
            setModalState({ type: 'closed' });
            refresh();
        } catch (error) {
            toast.error(t('review.error'));
        }
    };

    // Reset to page 1 on search
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil((total || 0) / limit);

    const { updateOptimistic, deleteOptimistic } = useApiOptimistic(documents, setData);

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

    useEffect(() => {
        const processingItems = documents.filter(d =>
            d.ingestionStatus === 'PROCESSING' ||
            d.ingestionStatus === 'PENDING'
        );

        if (processingItems.length > 0) {
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

            <EnrichmentModal
                isOpen={modalState.type === 'enrich'}
                onClose={() => setModalState({ type: 'closed' })}
                asset={modalState.type === 'enrich' ? modalState.asset : null}
                onSuccess={() => {
                    refresh();
                    setModalState({ type: 'closed' });
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

            <Dialog open={modalState.type === 'review'} onOpenChange={() => setModalState({ type: 'closed' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('review.dialog_title')}</DialogTitle>
                        <DialogDescription>{t('review.dialog_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="date"
                            value={reviewDate}
                            onChange={(e) => setReviewDate(e.target.value)}
                            min={format(new Date(), "yyyy-MM-dd")}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalState({ type: 'closed' })}>{tCommon('actions.cancel')}</Button>
                        <Button onClick={handleReviewSubmit}>{tCommon('actions.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title={t('metrics.active')}
                    value={stats.active}
                    icon={<Layers className="w-5 h-5" />}
                />
                <MetricCard
                    title={t('metrics.indexed')}
                    value={stats.totalChunks}
                    icon={<Database className="w-5 h-5" />}
                />
                <MetricCard
                    title={t('metrics.last_ingest')}
                    value={stats.lastIngest}
                    icon={<History className="w-5 h-5" />}
                />
            </div>

            <ContentCard>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-between">
                    <div className="flex flex-1 items-center gap-3 max-w-2xl">
                        <div className="relative flex-1">
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
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">{tCommon('filters.all_status') || 'Todos los Estados'}</option>
                            <option value="vigente">{t('status.active')}</option>
                            <option value="obsoleto">{t('status.obsolete')}</option>
                            <option value="archivado">{t('status.archived')}</option>
                        </select>
                        <select
                            value={reviewFilter}
                            onChange={(e) => setReviewFilter(e.target.value)}
                            className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">{t('review.filter_all') || 'Revisiones: Todas'}</option>
                            <option value="pending">{t('status.pending')}</option>
                            <option value="reviewed">{t('status.reviewed')}</option>
                            <option value="expired">{t('status.expired')}</option>
                        </select>
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
                                                onClick={() => setModalState({ type: 'upload' })}
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
                                                    {t('table.uploaded')}: {new Date(doc.createdAt).toLocaleDateString()}
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
                                    <TableCell className="text-right">
                                        <ActionsMenu
                                            doc={doc}
                                            t={t}
                                            handleStatusChange={handleStatusChange}
                                            handleDelete={handleDelete}
                                            onPreview={() => setModalState({ type: 'preview', id: doc._id, filename: doc.filename })}
                                            onManageRelationships={() => setModalState({ type: 'relationship', asset: doc })}
                                            onViewDiagnostics={() => setModalState({ type: 'diagnostic', id: doc._id, filename: doc.filename })}
                                            onScheduleReview={() => setModalState({ type: 'review', asset: doc })}
                                            onAnalyze={() => setModalState({ type: 'analyze', asset: doc })}
                                            onEnrich={() => setModalState({ type: 'enrich', asset: doc })}
                                            onViewChunks={() => setModalState({ type: 'chunks', asset: doc })}
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

            <QuickAnalyzeModal
                asset={modalState.type === 'analyze' ? modalState.asset : null}
                open={modalState.type === 'analyze'}
                onClose={() => setModalState({ type: 'closed' })}
            />

            <ChunksViewModal
                asset={modalState.type === 'chunks' ? modalState.asset : null}
                open={modalState.type === 'chunks'}
                onClose={() => setModalState({ type: 'closed' })}
            />
        </div>
    );
}

function ActionsMenu({ doc, t, handleStatusChange, handleDelete, onPreview, onManageRelationships, onViewDiagnostics, onScheduleReview, onAnalyze, onEnrich, onViewChunks, refresh }: any) {


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
                    className="rounded-lg gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-600 focus:bg-indigo-50 font-bold"
                    onClick={onAnalyze}
                    disabled={doc.ingestionStatus !== 'COMPLETED'}
                >
                    <Sparkles size={14} /> {t('actions.analyze') || 'Analizar/Consultar'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-50"
                    onClick={onEnrich}
                    disabled={doc.ingestionStatus !== 'COMPLETED'}
                >
                    <Zap size={14} /> Enriquecer Documento
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 focus:bg-blue-50"
                    onClick={onViewChunks}
                    disabled={doc.totalChunks === 0}
                >
                    <Database size={14} /> {t('actions.view_chunks') || 'Ver Chunks Ingestados'}
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

                {/* Phase 81: Review Actions */}
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuLabel className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-widest font-bold">{t('review.next_date')}</DropdownMenuLabel>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-indigo-600 focus:text-indigo-600 focus:bg-indigo-50"
                    onClick={onScheduleReview}
                >
                    <CalendarCheck size={14} /> {t('actions.mark_reviewed')}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="rounded-lg gap-2 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
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
                        className="rounded-lg gap-2 cursor-pointer text-teal-600 focus:text-teal-600 focus:bg-teal-50"
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
