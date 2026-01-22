'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, Plus, FileText, Download, Trash2, Shield } from 'lucide-react';

export default function MisDocumentosPage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await fetch('/api/auth/documentos');
            if (res.ok) {
                const data = await res.json();
                setDocs(data);
            }
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/auth/documentos', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast({
                    title: 'Documento subido',
                    description: 'Tu archivo se ha guardado correctamente.'
                });
                setIsModalOpen(false);
                fetchDocs();
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error al subir');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

        try {
            const res = await fetch(`/api/auth/documentos/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast({
                    title: 'Documento eliminado',
                    description: 'El archivo ha sido borrado con éxito.'
                });
                fetchDocs();
            } else {
                throw new Error('Error al borrar');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el documento.',
                variant: 'destructive'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-teal-600" />
                        Mis Documentos
                    </h1>
                    <p className="text-slate-500">Espacio personal para tus manuales, notas y archivos técnicos.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" /> Subir Archivo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Subir Nuevo Documento Personal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">Archivo</Label>
                                <Input id="file" name="file" type="file" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Input id="descripcion" name="descripcion" placeholder="¿Qué es este documento?" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={uploading} className="bg-teal-600 hover:bg-teal-700">
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Subir
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Tamaño</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {docs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="text-slate-300 dark:text-slate-700" size={48} />
                                        <p>No has subido ningún documento personal aún.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            docs.map((doc) => (
                                <TableRow key={doc._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded text-teal-600">
                                                <FileText size={16} />
                                            </div>
                                            {doc.nombre_original}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                        {doc.descripcion || '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        {(doc.tamanio_bytes / 1024 / 1024).toFixed(2)} MB
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs text-nowrap">
                                        {new Date(doc.creado).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" asChild>
                                                <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer">
                                                    <Download size={16} className="text-teal-600" />
                                                </a>
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(doc._id)}>
                                                <Trash2 size={16} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
