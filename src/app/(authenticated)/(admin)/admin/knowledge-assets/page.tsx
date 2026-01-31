"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Filter, FileText, CheckCircle2,
    AlertCircle, Clock, Trash2, Download, MoreVertical,
    Archive, ShieldOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUploadModal } from "@/components/admin/DocumentUploadModal";
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

interface KnowledgeAsset {
    _id: string;
    filename: string;
    componentType: string;
    model: string;
    version: string;
    status: 'vigente' | 'obsoleto' | 'borrador' | 'archivado' | 'active' | 'obsolete' | 'draft' | 'archived';
    totalChunks: number;
    createdAt: string;
    updatedAt: string;
}

export default function DocumentsPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // 1. Fetching con useApiList
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

    // 2. Optimización Perceptual (UX Instantánea)
    const { updateOptimistic, deleteOptimistic } = useApiOptimistic(documents, setData);

    // 3. Mutaciones con useApiMutation
    const statusMutation = useApiMutation({
        endpoint: '/api/admin/knowledge-assets/status',
        method: 'PATCH',
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'INFO',
                source: 'UI_DOCS',
                action: 'STATUS_CHANGE',
                message: 'Estado de documento actualizado',
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/admin/knowledge-assets/${id}`,
        method: 'DELETE',
        confirmMessage: (id) => `¿Estás seguro de eliminar este documento? Esta acción es irreversible.`,
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'WARN',
                source: 'UI_DOCS',
                action: 'DELETE_DOC',
                message: 'Documento eliminado del corpus',
            });
        }
    });

    const handleStatusChange = async (documentId: string, newStatus: string) => {
        // Actualización optimista para feedback inmediato
        updateOptimistic(documentId, { status: newStatus as any });

        try {
            await statusMutation.mutate({ documentId, status: newStatus });
        } catch (error) {
            // Si falla, el refresh del useApiList (vía mutation onSuccess o error) restaurará el estado
            refresh();
        }
    };

    const handleDelete = async (documentId: string) => {
        // Eliminación optimista
        const originalData = [...documents];
        deleteOptimistic(documentId);

        try {
            await deleteMutation.mutate(documentId);
        } catch (error) {
            setData(originalData);
        }
    };

    const filteredDocs = documents;

    const stats = {
        active: documents.filter(d => ['vigente', 'active'].includes(d.status)).length,
        totalChunks: documents.reduce((acc, d) => acc + (d.totalChunks || 0), 0),
        lastIngest: documents.length > 0 ? new Date(documents[0].createdAt).toLocaleString() : '-'
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Gestión del Corpus Técnico</h2>
                    <p className="text-slate-500 mt-1">Sube y gestiona los manuales que alimentan el sistema RAG.</p>
                </div>
                <Button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                >
                    <Plus size={18} />
                    Nuevo Documento
                </Button>
            </div>

            <DocumentUploadModal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false);
                    refresh();
                }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-teal-100 font-medium">Active Documents</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit">{stats.active}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Indexed Chunks</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">{stats.totalChunks.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Last Ingest</CardDescription>
                        <CardTitle className="text-lg font-bold font-outfit text-slate-900">{stats.lastIngest}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Buscar por nombre, componente o modelo..."
                                className="pl-10 border-slate-200 focus:ring-teal-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-slate-200 text-slate-600 gap-2">
                            <Filter size={18} />
                            Filtros
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[300px] font-bold text-slate-900">Documento</TableHead>
                                <TableHead className="font-bold text-slate-900">Tipo / Modelo</TableHead>
                                <TableHead className="font-bold text-slate-900">Versión</TableHead>
                                <TableHead className="font-bold text-slate-900">Estado</TableHead>
                                <TableHead className="font-bold text-slate-900">Fragmentos</TableHead>
                                <TableHead className="font-bold text-slate-900 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        Cargando documentos...
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        No se encontraron documentos.
                                    </TableCell>
                                </TableRow>
                            ) : filteredDocs.map((doc) => {
                                return (
                                    <TableRow key={doc._id} className="hover:bg-slate-50/50 transition-colors">
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
                                                        Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
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
                                        <TableCell className="font-mono text-xs text-slate-500">v{doc.version}</TableCell>
                                        <TableCell>
                                            {['vigente', 'active'].includes(doc.status) && (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 hover:bg-emerald-100">
                                                    <CheckCircle2 size={12} /> Active
                                                </Badge>
                                            )}
                                            {['obsoleto', 'obsolete'].includes(doc.status) && (
                                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 hover:bg-amber-100">
                                                    <AlertCircle size={12} /> Obsolete
                                                </Badge>
                                            )}
                                            {['archivado', 'archived'].includes(doc.status) && (
                                                <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1 hover:bg-slate-100">
                                                    <Archive size={12} /> Archived
                                                </Badge>
                                            )}
                                            {['borrador', 'draft'].includes(doc.status) && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 hover:bg-blue-100">
                                                    <Clock size={12} /> Draft
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-900">{doc.totalChunks}</span>
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-teal-500 h-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (doc.totalChunks / 100) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/api/admin/knowledge-assets/${doc._id}/download`, '_blank')}
                                                    >
                                                        <Download className="mr-2 h-4 w-4" /> Ver / Descargar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-[10px] text-slate-400">Cambiar Estado</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(doc._id, 'vigente')}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar Vigente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(doc._id, 'obsoleto')}>
                                                        <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Marcar Obsoleto
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(doc._id, 'archivado')}>
                                                        <Archive className="mr-2 h-4 w-4 text-slate-500" /> Archivar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
