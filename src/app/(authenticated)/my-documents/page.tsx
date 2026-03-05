"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    FileText,
    Trash2,
    Download,
    Clock,
    FileIcon,
    Loader2,
    CheckCircle2,
    X,
    HardDrive,
    Bot,
    Sparkles,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { getBusinessState } from "@/lib/ingest-states";

import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiFileUpload } from "@/hooks/useApiFileUpload";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { useSidekickStore } from "@/store/sidekick-store";

import { SplitPanel, SplitPanelLeft, SplitPanelRight } from "@/components/shared/SplitPanel";
import { UploadWizard } from "@/components/shared/UploadWizard";
import { ConversationalSearch } from "@/components/shared/ConversationalSearch";

interface PersonalDocument {
    _id: string;
    originalName: string;
    description?: string;
    createdAt: string;
    sizeBytes: number;
    cloudinaryUrl: string;
    ingestionStatus?: string;
}

export default function MyDocumentsPage() {
    const t = useTranslations('myDocuments');
    const tUpload = useTranslations('myDocuments.upload');
    const tTable = useTranslations('myDocuments.table');
    const tStorage = useTranslations('myDocuments.storage');
    const [searchTerm, setSearchTerm] = useState("");

    // Split Panel State
    const [selectedDocument, setSelectedDocument] = useState<PersonalDocument | null>(null);
    const [isUploadWizardOpen, setIsUploadWizardOpen] = useState(false);

    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Fetching con useApiList
    const {
        data: documents,
        isLoading,
        refresh,
        setData
    } = useApiList<PersonalDocument>({
        endpoint: '/api/auth/knowledge-assets',
        filters: { search: searchTerm },
    });

    // 2. Optimismo UI
    const { deleteOptimistic } = useApiOptimistic(documents, setData);

    const { upload, isUploading } = useApiFileUpload({
        endpoint: '/api/auth/knowledge-assets',
        onSuccess: () => {
            toast.success(tUpload('successTitle'), {
                description: "Documento subido e inicializado correctamente.",
            });
            setIsUploadWizardOpen(false);
            refresh();
        },
        onError: (err) => {
            toast.error(t('error') || 'Error', {
                description: err,
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/auth/knowledge-assets/${id}`,
        method: 'DELETE',
        confirmMessage: t('confirmDelete'),
        onSuccess: () => {
            toast.success(t('deleteSuccessTitle'), {
                description: t('deleteSuccess'),
            });
            refresh();
        },
        onError: (err) => {
            toast.error(t('error') || 'Error', {
                description: err,
            });
        }
    });

    useEffect(() => {
        setIsMounted(true);
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/admin/document-types?category=USER_DOCUMENT');
                if (res.ok) {
                    const data = await res.json();
                    const types = Array.isArray(data) ? data : (data.data ?? data.documentTypes ?? []);
                    setDocumentTypes(types);
                }
            } catch (error) {
                console.error('Error fetching document types:', error);
            }
        };
        fetchTypes();
    }, []);

    const handleUploadSubmit = async (file: File, options: any) => {
        await upload(file, options);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("confirmDelete") || "Are you sure?")) return;
        const original = [...(documents || [])];
        deleteOptimistic(id);
        if (selectedDocument?._id === id) {
            setSelectedDocument(null);
        }
        try {
            await deleteMutation.mutate(id);
        } catch (error) {
            setData(original);
            toast.error("Error al eliminar");
        }
    };

    const { setContext } = useSidekickStore();

    useEffect(() => {
        if (selectedDocument) {
            setContext(`Documento: ${selectedDocument.originalName}`, {
                id: selectedDocument._id,
                type: 'knowledge-asset',
                originalName: selectedDocument.originalName
            });
        } else {
            setContext('Mis Documentos');
        }
    }, [selectedDocument, setContext]);

    const filteredDocs = documents;

    if (!isMounted || (isLoading && documents.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                <Loader2 className="animate-spin mb-4 h-10 w-10 text-teal-600" />
                <p className="animate-pulse">{tTable('loadingRepo')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title={t('titleAlt')}
                subtitle={t('subtitleAlt')}
                helpId="documents-status"
                actions={
                    <Button
                        onClick={() => {
                            setIsUploadWizardOpen(true);
                            setSelectedDocument(null);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                        disabled={isUploadWizardOpen}
                    >
                        <Plus size={18} />
                        {tUpload('button')}
                    </Button>
                }
            />

            <SplitPanel className="flex-1 pb-6 min-h-0">
                <SplitPanelLeft className="h-full overflow-hidden flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 mb-6">
                        <Card className="md:col-span-1 border-none shadow-md bg-slate-900 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tStorage('title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <HardDrive className="text-teal-400" size={20} />
                                    <div>
                                        <p className="text-xl font-black">{documents.length}</p>
                                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{tStorage('totalFiles')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3 border-none shadow-sm">
                            <CardContent className="p-4 flex items-center h-full">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        placeholder={t('search')}
                                        className="pl-10 border-slate-200 dark:border-slate-700 focus:ring-teal-500/20 bg-slate-50 dark:bg-slate-900/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') refresh();
                                            if (e.key === 'Escape') setSearchTerm("");
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
                        {isUploadWizardOpen ? (
                            <CardContent className="p-6 overflow-y-auto custom-scrollbar">
                                <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Subir Documento</h3>
                                        <p className="text-sm text-slate-500">Configura la ingesta en el motor RAG</p>
                                    </div>
                                </div>
                                <UploadWizard
                                    documentTypes={documentTypes}
                                    onUpload={handleUploadSubmit}
                                    isUploading={isUploading}
                                    onCancel={() => setIsUploadWizardOpen(false)}
                                />
                            </CardContent>
                        ) : (
                            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <Loader2 className="animate-spin mb-4" size={40} />
                                        <p>{tTable('loading')}</p>
                                    </div>
                                ) : filteredDocs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <FileIcon size={48} className="mb-4 opacity-20" />
                                        <p className="font-medium text-slate-600 dark:text-slate-400 mb-4">
                                            {searchTerm !== "" ? tTable('noResults') : tTable('empty')}
                                        </p>
                                        <Button
                                            onClick={() => setIsUploadWizardOpen(true)}
                                            className="bg-primary hover:bg-primary/90 text-white gap-2"
                                            size="sm"
                                        >
                                            <Plus size={16} />
                                            {tUpload('button')}
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 pl-6">{tTable('file')}</TableHead>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Estado</TableHead>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Recomendación IA</TableHead>
                                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-slate-500 pr-6">{tTable('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDocs.map((doc) => (
                                                <TableRow
                                                    key={doc._id}
                                                    className={cn(
                                                        "cursor-pointer transition-colors border-l-[3px]",
                                                        selectedDocument?._id === doc._id
                                                            ? "bg-teal-50/50 dark:bg-teal-900/20 border-l-teal-500 hover:bg-teal-50/80"
                                                            : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-l-transparent"
                                                    )}
                                                    onClick={() => setSelectedDocument(doc)}
                                                >
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-lg text-slate-500 transition-colors shadow-sm border",
                                                                selectedDocument?._id === doc._id
                                                                    ? "bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800"
                                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                            )}>
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="max-w-[180px] md:max-w-xs xl:max-w-[200px]">
                                                                <p className={cn(
                                                                    "font-semibold truncate text-[13px]",
                                                                    selectedDocument?._id === doc._id ? "text-teal-700 dark:text-teal-400" : "text-slate-900 dark:text-slate-100"
                                                                )} title={doc.originalName}>
                                                                    {doc.originalName}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                                                                    <span className="truncate">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const state = getBusinessState(doc.ingestionStatus || 'COMPLETED');
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn("w-1.5 h-1.5 rounded-full", state.color.replace('text-', 'bg-'))} />
                                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", state.color)}>{state.label}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {doc.ingestionStatus === 'COMPLETED' ? (
                                                                <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 w-fit hover:bg-teal-100 cursor-pointer">
                                                                    <Sparkles size={10} className="mr-1" /> Generar Informe
                                                                </Badge>
                                                            ) : doc.ingestionStatus === 'FAILED' ? (
                                                                <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700 border-rose-200 w-fit hover:bg-rose-100 cursor-pointer">
                                                                    <RefreshCw size={10} className="mr-1" /> Reintentar Ingesta
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 w-fit">
                                                                    <Clock size={10} className="mr-1" /> Esperando IA
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 h-8 w-8"
                                                                asChild
                                                                aria-label={tTable('download')}
                                                            >
                                                                <a href={doc.cloudinaryUrl} target="_blank" rel="noopener noreferrer" download={doc.originalName}>
                                                                    <Download size={16} />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(doc._id);
                                                                }}
                                                                aria-label={tTable('delete')}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        )}
                    </Card>
                </SplitPanelLeft>

                <SplitPanelRight className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                    {selectedDocument ? (
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Analizando Contexto</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate" title={selectedDocument.originalName}>
                                        {selectedDocument.originalName}
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 bg-teal-500/5 border-teal-500/20 text-teal-600 hover:bg-teal-500/10">
                                        <Sparkles size={12} />
                                        Generar Informe Técnico
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setSelectedDocument(null)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ConversationalSearch filename={selectedDocument.originalName} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Análisis de Contexto</h3>
                            <p className="text-sm text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">
                                Selecciona un documento de la lista lateral para iniciar una sesión de chat enfocada exclusivamente en su contenido.
                            </p>
                        </div>
                    )}
                </SplitPanelRight>
            </SplitPanel>
        </div>
    );
}
