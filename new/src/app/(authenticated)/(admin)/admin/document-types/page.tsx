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
import { useFormModal } from '@/hooks/useFormModal';
import { DataTable, Column } from "@/components/ui/data-table";

interface DocumentType {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export default function DocumentTypesPage() {
    const modal = useFormModal<DocumentType>();

    // 1. Gestión de datos
    const { data: types, isLoading, refresh } = useApiList<DocumentType>({
        endpoint: '/api/admin/document-types',
    });

    // 2. Mutaciones (Crear/Editar y Borrar)
    const { mutate: saveType, isLoading: isSaving } = useApiMutation({
        endpoint: modal.data ? '/api/admin/document-types' : '/api/admin/document-types',
        method: modal.data ? 'PATCH' : 'POST',
        onSuccess: () => {
            modal.close();
            refresh();
        },
        successMessage: () => modal.data ? 'Type updated successfully' : 'Type created successfully',
    });

    const { mutate: deleteType } = useApiMutation({
        endpoint: (vars: { id: string }) => `/api/admin/document-types?id=${vars.id}`,
        method: 'DELETE',
        confirmMessage: 'Are you sure you want to delete this document type?',
        onSuccess: () => refresh(),
    });

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            isActive: true
        };

        if (modal.data) {
            data.id = modal.data._id;
        }

        saveType(data);
    };

    // 3. Definición de columnas
    const columns: Column<DocumentType>[] = [
        {
            header: "Name",
            accessorKey: "name",
            className: "font-medium"
        },
        {
            header: "Description",
            accessorKey: "description",
            cell: (t) => t.description || '-'
        },
        {
            header: "Status",
            cell: (t) => t.isActive ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 size={14} /> Active
                </span>
            ) : (
                <span className="flex items-center gap-1 text-slate-400 text-sm">
                    <XCircle size={14} /> Inactive
                </span>
            )
        },
        {
            header: "Created",
            cell: (t) => (
                <span className="text-slate-500 text-xs">
                    {new Date(t.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (t) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => {
                            modal.openEdit(t);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteType({ id: t._id })}
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
                        Document <span className="text-teal-600">Types</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Configure technical document categories for RAG.</p>
                </div>

                <Dialog open={modal.isOpen} onOpenChange={modal.setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={modal.openCreate}>
                            <Plus className="mr-2 h-4 w-4" /> New Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{modal.data ? 'Edit Document Type' : 'Create New Document Type'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" defaultValue={modal.data?.name} placeholder="Ex: Controller, Motor, etc." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" defaultValue={modal.data?.description} placeholder="Optional" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={modal.close} disabled={isSaving}>Cancel</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {modal.data ? 'Saving...' : 'Creating...'}
                                        </>
                                    ) : (modal.data ? 'Save Changes' : 'Create')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                data={types || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No document types configured."
            />
        </div>
    );
}
