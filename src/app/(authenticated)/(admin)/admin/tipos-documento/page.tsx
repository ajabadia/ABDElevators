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
import { Loader2, Plus, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function TiposDocumentoPage() {
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            activo: true
        };

        try {
            const res = await fetch('/api/admin/tipos-documento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                toast({
                    title: 'Tipo creado',
                    description: 'El tipo de documento se ha guardado correctamente.'
                });
                setIsModalOpen(false);
                fetchTipos();
            } else {
                throw new Error('Error al crear');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el tipo de documento.',
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
                        <FileText className="text-teal-600" />
                        Tipos de Documento
                    </h1>
                    <p className="text-slate-500">Configura las categorías de documentos técnicos para el RAG.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Tipo de Documento</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input id="nombre" name="nombre" placeholder="Ej: Botonera, Motor, etc." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Input id="descripcion" name="descripcion" placeholder="Opcional" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Crear</Button>
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
                                    <TableCell className="text-slate-500 text-xs">
                                        {new Date(tipo.creado).toLocaleDateString()}
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
