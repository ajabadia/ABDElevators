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
    HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiFileUpload } from "@/hooks/useApiFileUpload";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { useFormModal } from "@/hooks/useFormModal";

interface MisDocumentos {
    _id: string;
    nombre_original: string;
    descripcion?: string;
    creado: string;
    tamanio_bytes: number;
    cloudinary_url: string;
}

export default function MisDocumentosPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Fetching con useApiList
    const {
        data: documentos,
        isLoading,
        refresh,
        setData
    } = useApiList<MisDocumentos>({
        endpoint: '/api/auth/documentos',
        filters: { search: searchTerm },
    });

    // 2. Optimismo UI
    const { deleteOptimistic, addOptimistic } = useApiOptimistic(documentos, setData);

    // 3. Modales y Carga
    const uploadModal = useFormModal({
        onClose: () => {
            setFile(null);
            setDescripcion("");
        }
    });

    const { upload, isUploading, progress } = useApiFileUpload({
        endpoint: '/api/auth/documentos',
        onSuccess: () => {
            toast({
                title: "Documento subido",
                description: "El archivo se ha guardado correctamente.",
            });
            uploadModal.close();
            refresh();
        },
        onError: (err) => {
            toast({
                title: "Error",
                description: err,
                variant: "destructive",
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/auth/documentos/${id}`,
        method: 'DELETE',
        confirmMessage: '¿Deseas eliminar este archivo de tu repositorio personal?',
        onSuccess: () => {
            toast({
                title: "Documento eliminado",
                description: "El archivo ha sido borrado.",
            });
            refresh();
        },
        onError: (err) => {
            toast({
                title: "Error",
                description: err,
                variant: "destructive",
            });
        }
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        await upload(file, { descripcion });
    };

    const handleDelete = async (id: string) => {
        const original = [...documentos];
        deleteOptimistic(id);
        try {
            await deleteMutation.mutate(id);
        } catch (error) {
            setData(original);
        }
    };

    const filteredDocs = documentos;

    if (!isMounted || (isLoading && documentos.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                <Loader2 className="animate-spin mb-4 h-10 w-10 text-teal-600" />
                <p className="animate-pulse">Cargando repositorio personal...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Mis <span className="text-teal-600">Archivos</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Tu repositorio personal de manuales y archivos técnicos.
                    </p>
                </div>
                <Button
                    onClick={() => uploadModal.openCreate()}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                >
                    <Plus size={18} />
                    Subir Archivo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 border-none shadow-md bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">Almacenamiento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <HardDrive className="text-teal-400" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{documentos.length}</p>
                                <p className="text-xs text-slate-500">Archivos totales</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-teal-500 h-full w-[15%]"></div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">0.8 GB de 5 GB usados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-none shadow-lg">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Buscar en mis documentos..."
                                className="pl-10 border-slate-200 dark:border-slate-700 focus:ring-teal-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Loader2 className="animate-spin mb-4" size={40} />
                                <p>Cargando tus archivos...</p>
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <FileIcon size={48} className="mb-4 opacity-20" />
                                <p>No se encontraron documentos.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">Archivo</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">Fecha</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">Tamaño</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-100">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocs.map((doc) => (
                                        <TableRow key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{doc.nombre_original}</p>
                                                        {doc.descripcion && (
                                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.descripcion}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock size={12} />
                                                    {new Date(doc.creado).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {(doc.tamanio_bytes / 1024 / 1024).toFixed(2)} MB
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-teal-600"
                                                        asChild
                                                    >
                                                        <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer" download={doc.nombre_original}>
                                                            <Download size={18} />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-red-600"
                                                        onClick={() => handleDelete(doc._id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Subida */}
            <Dialog open={uploadModal.isOpen} onOpenChange={uploadModal.setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Subir Nuevo Documento</DialogTitle>
                        <DialogDescription>
                            El archivo se guardará en tu repositorio personal.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Archivo PDF</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                required
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Descripción (Opcional)</Label>
                            <Input
                                id="desc"
                                placeholder="Ej: Manual de la obra 123"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => uploadModal.close()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isUploading || !file} className="bg-teal-600 hover:bg-teal-700">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : "Guardar Archivo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
