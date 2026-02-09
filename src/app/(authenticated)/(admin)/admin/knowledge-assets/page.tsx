"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Filter, FileText, CheckCircle2,
    AlertCircle, Clock, Trash2, Download, MoreVertical,
    Archive, ShieldOff, RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UnifiedIngestModal } from "@/components/admin/knowledge/UnifiedIngestModal";
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

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Layers, Database, History } from "lucide-react";

import { useTranslations } from "next-intl";
import { KnowledgeAsset, AssetStatus, IngestionStatus } from "@/types/knowledge";

export default function DocumentsPage() {
    const { toast } = useToast();
    const t = useTranslations('knowledge_assets');
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // 1. Fetching with useApiList
    const {
        data: documents,
        isLoading,
        refresh,
        setData
    } = useApiList<KnowledgeAsset>({
        endpoint: '/api/admin/knowledge-assets',
        filters: { search: searchTerm },
        dataKey: 'assets'
    });

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

    // 4. Auto-refresh
    useEffect(() => {
        const hasProcessing = documents.some(d => d.ingestionStatus === 'PROCESSING' || d.ingestionStatus === 'PENDING');
        if (hasProcessing) {
            const interval = setInterval(refresh, 3000);
            return () => clearInterval(interval);
        }
    }, [documents, refresh]);

    const stats = {
        active: documents.filter(d => ['vigente', 'active'].includes(d.status)).length,
        totalChunks: documents.reduce((acc, d) => acc + (d.totalChunks || 0), 0),
        lastIngest: documents.length > 0 ? new Date(documents[0].createdAt).toLocaleString() : '-'
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title').split(' ')[0]} // "Gestión"
                highlight={t('title').split(' ').slice(1).join(' ')} // "del Corpus Técnico"
                subtitle={t('subtitle')}
                actions={
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                    >
                        <Plus size={18} />
                        {t('actions.new')}
                    </Button>
                }
            />

            <UnifiedIngestModal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false);
                    refresh();
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title={t('metrics.active')}
                    value={stats.active}
                    icon={<Layers className="w-5 h-5" />}
                    color="teal"
                />
                <MetricCard
                    title={t('metrics.indexed')}
                    value={stats.totalChunks}
                    icon={<Database className="w-5 h-5" />}
                    color="blue"
                />
                <MetricCard
                    title={t('metrics.last_ingest')}
                    value={stats.lastIngest}
                    icon={<History className="w-5 h-5" />}
                    color="slate"
                />
            </div>

            <ContentCard>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder={t('search_placeholder')}
                            className="pl-10 border-slate-200 focus:ring-teal-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[35%] font-bold text-slate-900">{t('table.document')}</TableHead>
                                <TableHead className="w-[20%] font-bold text-slate-900">{t('table.type_model')}</TableHead>
                                <TableHead className="w-[15%] font-bold text-slate-900">{t('table.status')}</TableHead>
                                <TableHead className="w-[15%] font-bold text-slate-900">{t('table.chunks')}</TableHead>
                                <TableHead className="w-[15%] font-bold text-slate-900 text-right">{t('table.actions')}</TableHead>
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
                                                <p className="text-slate-900 font-semibold truncate" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">
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
                                    <TableCell className="w-[15%]">
                                        <div className="flex flex-col gap-1">
                                            {doc.ingestionStatus === 'PENDING' && (
                                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1 animate-pulse">
                                                    <Clock size={12} /> {t('status.pending')}
                                                </Badge>
                                            )}
                                            {doc.ingestionStatus === 'PROCESSING' && (
                                                <div className="space-y-1 w-24">
                                                    <div className="flex justify-between text-[10px] text-teal-600 font-bold">
                                                        <span>{doc.progress}%</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-teal-500 h-full transition-all duration-500"
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
                                            <span className="text-sm font-semibold text-slate-900">{doc.totalChunks}</span>
                                            <div className="flex-1 max-w-[40px] h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-teal-500 h-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (doc.totalChunks / 200) * 100)}%` }}
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
                                            refresh={refresh}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </ContentCard>
        </PageContainer>
    );
}

function ActionsMenu({ doc, t, handleStatusChange, handleDelete, refresh }: any) {
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
