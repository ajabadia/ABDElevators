'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
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
import { ContentCard } from '@/components/ui/content-card';
import { useApiList } from '@/hooks/useApiList';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useFormModal } from '@/hooks/useFormModal';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Loader2, Plus, FileText, Download, Shield } from 'lucide-react';
import { OptimisticDelete } from '@/components/shared/OptimisticDelete';
import { DataStateIndicator } from '@/components/shared/DataStateIndicator';

interface PersonalDocument {
    _id: string;
    originalName: string;
    description?: string;
    sizeBytes: number;
    cloudinaryUrl: string;
    createdAt: string;
}

export default function MyDocumentsPage() {
    const { toast } = useToast();
    const modal = useFormModal();

    // 1. Gestión de datos con hook genérico
    const {
        data: docs,
        isLoading: loading,
        error: listError,
        refresh: fetchDocs
    } = useApiList<PersonalDocument>({
        endpoint: '/api/auth/knowledge-assets'
    });

    // 2. Mutación para Subir (usado por el formulario)
    const { mutate: uploadDoc, isLoading: uploading } = useApiMutation({
        endpoint: '/api/auth/knowledge-assets',
        method: 'POST',
        successMessage: 'Documento subido correctamente.',
        onSuccess: () => {
            modal.close();
            fetchDocs();
        }
    });

    // 3. Función de eliminación para OptimisticDelete
    const handleDelete = async (id: string) => {
        // En este caso llamamos a fetch directamente porque el componente maneja su propio estado
        const res = await fetch(`/api/auth/knowledge-assets/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        fetchDocs();
    };

    const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        uploadDoc(formData);
    };

    // 4. Definición de Columnas
    const columns: Column<PersonalDocument>[] = [
        {
            header: "Name",
            cell: (doc) => (
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded text-teal-600">
                        <FileText size={16} />
                    </div>
                    <span className="font-medium">{doc.originalName}</span>
                </div>
            )
        },
        {
            header: "Description",
            accessorKey: "description",
            cell: (doc) => <span className="text-slate-600 dark:text-slate-400 max-w-xs truncate">{doc.description || '-'}</span>
        },
        {
            header: "Size",
            cell: (doc) => <span className="text-slate-500 text-xs">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
        },
        {
            header: "Date",
            cell: (doc) => <span className="text-slate-500 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</span>
        },
        {
            header: "Actions",
            cell: (doc) => (
                <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" asChild title="Descargar">
                        <a href={doc.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                            <Download size={16} className="text-teal-600" />
                        </a>
                    </Button>
                    <OptimisticDelete
                        itemId={doc._id}
                        onDelete={handleDelete}
                        onSuccess={() => fetchDocs()}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="text-teal-600" />
                            Mis Documentos
                        </h1>
                        <DataStateIndicator
                            isLoading={loading}
                            isError={!!listError}
                            isCached={docs && docs.length > 0}
                        />
                    </div>
                    <p className="text-slate-500">Espacio personal para tus manuales, notas y archivos técnicos.</p>
                </div>

                <Dialog open={modal.isOpen} onOpenChange={modal.setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => modal.openCreate()} className="bg-teal-600 hover:bg-teal-700">
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
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" placeholder="What is this document?" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => modal.close()}>Cancelar</Button>
                                <Button type="submit" disabled={uploading} className="bg-teal-600 hover:bg-teal-700">
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Subir
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <ContentCard noPadding={true}>
                <DataTable
                    columns={columns}
                    data={docs || []}
                    isLoading={loading}
                    emptyMessage="No has subido ningún documento personal aún."
                />
            </ContentCard>
        </div>
    );
}
