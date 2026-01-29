'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Plus, CheckCircle2, XCircle, Pencil, Trash2, Loader2 } from 'lucide-react';

// Hooks y componentes genéricos
import { useApiList } from '@/hooks/useApiList';
import { useApiMutation } from '@/hooks/useApiMutation';
import { DataTable, Column } from '@/components/shared/DataTable';

interface TipoDocumento {
    _id: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    creado: string;
}

export default function TiposDocumentoPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTipo, setEditingTipo] = useState<TipoDocumento | null>(null);

    // 1. Gestión de datos
    const { data: tipos, isLoading, refresh } = useApiList<TipoDocumento>({
        endpoint: '/api/admin/tipos-documento',
    });

    // 2. Mutaciones (Crear/Editar y Borrar)
    const { mutate: saveTipo, isLoading: isSaving } = useApiMutation({
        endpoint: editingTipo ? '/api/admin/tipos-documento' : '/api/admin/tipos-documento',
        method: editingTipo ? 'PATCH' : 'POST',
        onSuccess: () => {
            setIsModalOpen(false);
            setEditingTipo(null);
            refresh();
        },
        successMessage: () => editingTipo ? 'Tipo actualizado correctamente' : 'Tipo creado correctamente',
    });

    const { mutate: deleteTipo } = useApiMutation({
        endpoint: (vars: { id: string }) => `/api/admin/tipos-documento?id=${vars.id}`,
        method: 'DELETE',
        confirmMessage: '¿Estás seguro de que deseas eliminar este tipo de documento?',
        onSuccess: () => refresh(),
    });

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {
            nombre: formData.get('nombre') as string,
            descripcion: formData.get('descripcion') as string,
            activo: true
        };

        if (editingTipo) {
            data.id = editingTipo._id;
        }

        saveTipo(data);
    };

    // 3. Definición de columnas
    const columns: Column<TipoDocumento>[] = [
        {
            header: "Nombre",
            accessorKey: "nombre",
            className: "font-medium"
        },
        {
            header: "Descripción",
            accessorKey: "descripcion",
            cell: (t) => t.descripcion || '-'
        },
        {
            header: "Estado",
            cell: (t) => t.activo ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 size={14} /> Activo
                </span>
            ) : (
                <span className="flex items-center gap-1 text-slate-400 text-sm">
                    <XCircle size={14} /> Inactivo
                </span>
            )
        },
        {
            header: "Creado",
            cell: (t) => (
                <span className="text-slate-500 text-xs">
                    {new Date(t.creado).toLocaleDateString()}
                </span>
            )
        },
        {
            header: "Acciones",
            className: "text-right",
            cell: (t) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => {
                            setEditingTipo(t);
                            setIsModalOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteTipo({ id: t._id })}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

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
                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input id="nombre" name="nombre" defaultValue={editingTipo?.nombre} placeholder="Ej: Botonera, Motor, etc." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Input id="descripcion" name="descripcion" defaultValue={editingTipo?.descripcion} placeholder="Opcional" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                                    {isSaving ? (
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

            <DataTable
                data={tipos || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No hay tipos de documento configurados."
            />
        </div>
    );
}
