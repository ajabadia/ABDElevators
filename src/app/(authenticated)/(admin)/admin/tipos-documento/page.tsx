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
import { Loader2, Plus, FileText, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';

export default function TiposDocumentoPage() {
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTipo, setEditingTipo] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchTipos();
    }, []);

    const fetchTipos = async () => {
        try {
            const res = await fetch('/api/admin/tipos-documento');
            if (res.ok) {
                const data = await res.json();
                setTipos(data);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    const handleAction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const formData = new FormData(e.currentTarget);
            const data = {
                nombre: formData.get('nombre') as string,
                descripcion: formData.get('descripcion') as string,
                activo: true
            };

            const url = '/api/admin/tipos-documento';
            const method = editingTipo ? 'PATCH' : 'POST';
            const body = editingTipo ? { ...data, id: editingTipo._id } : data;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast({
                    title: editingTipo ? 'Tipo actualizado' : 'Tipo creado',
                    description: `El tipo de documento se ha ${editingTipo ? 'actualizado' : 'guardado'} correctamente.`
                });
                setIsModalOpen(false);
                setEditingTipo(null);
                fetchTipos();
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al procesar');
            }
        } catch (error: any) {
            console.error('Error processing type:', error);
            toast({
                title: 'Error',
                description: error.message || 'No se pudo procesar la solicitud.',
                variant: 'destructive'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este tipo de documento?')) return;

        try {
            const res = await fetch(`/api/admin/tipos-documento?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast({
                    title: 'Tipo eliminado',
                    description: 'El tipo de documento se ha eliminado correctamente.'
                });
                fetchTipos();
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al eliminar');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
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
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Tipos de <span className="text-teal-600">Documento</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Configura las categorías de documentos técnicos para el RAG.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingTipo(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTipo ? 'Editar Tipo de Documento' : 'Crear Nuevo Tipo de Documento'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAction} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input id="nombre" name="nombre" defaultValue={editingTipo?.nombre} placeholder="Ej: Botonera, Motor, etc." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Input id="descripcion" name="descripcion" defaultValue={editingTipo?.descripcion} placeholder="Opcional" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isCreating}>Cancelar</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {editingTipo ? 'Guardando...' : 'Creando...'}
                                        </>
                                    ) : (editingTipo ? 'Guardar Cambios' : 'Crear')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tipos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                    No hay tipos de documento configurados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tipos.map((tipo) => (
                                <TableRow key={tipo._id}>
                                    <TableCell className="font-medium">{tipo.nombre}</TableCell>
                                    <TableCell>{tipo.descripcion || '-'}</TableCell>
                                    <TableCell>
                                        {tipo.activo ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                <CheckCircle2 size={14} /> Activo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-400 text-sm">
                                                <XCircle size={14} /> Inactivo
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs text-nowrap">
                                        {new Date(tipo.creado).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                                onClick={() => {
                                                    setEditingTipo(tipo);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(tipo._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
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
