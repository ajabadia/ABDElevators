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
import { logEventoCliente } from "@/lib/logger-client";

interface Documento {
    _id: string;
    nombre_archivo: string;
    tipo_componente: string;
    modelo: string;
    version: string;
    estado: 'vigente' | 'obsoleto' | 'borrador' | 'archivado';
    total_chunks: number;
    creado: string;
    fecha_revision: string;
}

export default function DocumentosPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // 1. Fetching con useApiList
    const {
        data: documentos,
        isLoading,
        refresh,
        setData
    } = useApiList<Documento>({
        endpoint: '/api/admin/documentos',
        filters: { search: searchTerm },
        dataKey: 'documentos'
    });

    // 2. Optimización Perceptual (UX Instantánea)
    const { updateOptimistic, deleteOptimistic } = useApiOptimistic(documentos, setData);

    // 3. Mutaciones con useApiMutation
    const statusMutation = useApiMutation({
        endpoint: '/api/admin/documentos/status',
        method: 'PATCH',
        onSuccess: () => {
            refresh();
            logEventoCliente({
                nivel: 'INFO',
                origen: 'UI_DOCS',
                accion: 'STATUS_CHANGE',
                mensaje: 'Estado de documento actualizado',
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/admin/documentos/${id}`,
        method: 'DELETE',
        confirmMessage: (id) => `¿Estás seguro de eliminar este documento? Esta acción es irreversible.`,
        onSuccess: () => {
            refresh();
            logEventoCliente({
                nivel: 'WARN',
                origen: 'UI_DOCS',
                accion: 'DELETE_DOC',
                mensaje: 'Documento eliminado del corpus',
            });
        }
    });

    const handleStatusChange = async (documentId: string, nuevoEstado: string) => {
        // Actualización optimista para feedback inmediato
        updateOptimistic(documentId, { estado: nuevoEstado as any });

        try {
            await statusMutation.mutate({ documentId, nuevoEstado });
        } catch (error) {
            // Si falla, el refresh del useApiList (vía mutation onSuccess o error) restaurará el estado
            refresh();
        }
    };

    const handleDelete = async (documentId: string) => {
        // Eliminación optimista
        const originalData = [...documentos];
        deleteOptimistic(documentId);

        try {
            await deleteMutation.mutate(documentId);
        } catch (error) {
            setData(originalData);
        }
    };

    const filteredDocs = documentos; // useApiList ya maneja el filtrado via server/query si lo configuramos, 
    // o si no, el search prop puede usarse para filtrar localmente si se desea.
    // En este caso, lo dejamos para que useApiList lo maneje via API.

    const stats = {
        vigentes: documentos.filter(d => d.estado === 'vigente').length,
        totalChunks: documentos.reduce((acc, d) => acc + d.total_chunks, 0),
        ultimaIngesta: documentos.length > 0 ? new Date(documentos[0].creado).toLocaleString() : '-'
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
                        <CardDescription className="text-teal-100 font-medium">Documentos Vigentes</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit">{stats.vigentes}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Chunks Indexados</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">{stats.totalChunks.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Última Ingesta</CardDescription>
                        <CardTitle className="text-lg font-bold font-outfit text-slate-900">{stats.ultimaIngesta}</CardTitle>
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
                            ) : filteredDocs.map((doc) => (
                                <TableRow key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded text-slate-500">
                                                <FileText size={18} />
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="text-slate-900 font-semibold truncate" title={doc.nombre_archivo}>
                                                    {doc.nombre_archivo}
                                                </p>
                                                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">
                                                    Subido: {new Date(doc.creado).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase">
                                                {doc.tipo_componente}
                                            </Badge>
                                            <p className="text-xs font-bold text-slate-700">{doc.modelo}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">v{doc.version}</TableCell>
                                    <TableCell>
                                        {doc.estado === "vigente" && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 hover:bg-emerald-100">
                                                <CheckCircle2 size={12} /> Vigente
                                            </Badge>
                                        )}
                                        {doc.estado === "obsoleto" && (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 hover:bg-amber-100">
                                                <AlertCircle size={12} /> Obsoleto
                                            </Badge>
                                        )}
                                        {doc.estado === "archivado" && (
                                            <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1 hover:bg-slate-100">
                                                <Archive size={12} /> Archivado
                                            </Badge>
                                        )}
                                        {doc.estado === "borrador" && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 hover:bg-blue-100">
                                                <Clock size={12} /> Borrador
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">{doc.total_chunks}</span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-teal-500 h-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (doc.total_chunks / 100) * 100)}%` }}
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
                                                    onClick={() => window.open(`/api/admin/documentos/${doc._id}/download`, '_blank')}
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
