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
import { DataTable, Column } from "@/components/ui/data-table";
import { Loader2, Plus, FileText, Download, Shield } from 'lucide-react';
import { OptimisticDelete } from '@/components/shared/OptimisticDelete';
import { DataStateIndicator } from '@/components/shared/DataStateIndicator';
import { useTranslations } from 'next-intl';

interface PersonalDocument {
    _id: string;
    originalName: string;
    description?: string;
    sizeBytes: number;
    cloudinaryUrl: string;
    createdAt: string;
    fileMd5?: string;
}

export default function MyDocumentsPage() {
    const t = useTranslations('myDocuments');
    const tUpload = useTranslations('myDocuments.upload');
    const tTable = useTranslations('myDocuments.table');
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

    // 1.5 Fetch Document Types
    const { data: docTypes } = useApiList<{ _id: string, name: string }>({
        endpoint: '/api/admin/document-types?category=USER_DOCUMENT'
    });

    // 2. Mutación para Subir (usado por el formulario)
    const { mutate: uploadDoc, isLoading: uploading } = useApiMutation({
        endpoint: '/api/auth/knowledge-assets',
        method: 'POST',
        successMessage: tUpload('successGeneric'),
        onSuccess: () => {
            modal.close();
            fetchDocs();
            toast({ title: tUpload('successTitle'), description: tUpload('successDesc') });
        },
        onError: (err) => {
            console.error("Upload failed", err);
            toast({
                title: tUpload('errorTitle'),
                description: typeof err === 'string' ? err : tUpload('errorDesc'),
                variant: 'destructive'
            });
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

        // Validación básica cliente
        const file = formData.get('file') as File;
        if (file && file.size > 10 * 1024 * 1024) {
            toast({ title: "Error", description: "El archivo es demasiado grande (Máx 10MB)", variant: "destructive" });
            return;
        }

        uploadDoc(formData);
    };

    // 4. Definición de Columnas
    const columns: Column<PersonalDocument>[] = [
        {
            header: tTable('name'),
            cell: (doc) => (
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded text-teal-600">
                        <FileText size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{doc.originalName}</span>
                        {doc.fileMd5 && (
                            <span className="text-[10px] text-slate-400 font-mono" title="MD5 Hash for Deduplication">
                                {doc.fileMd5}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: tTable('description'),
            accessorKey: "description",
            cell: (doc) => <span className="text-slate-600 dark:text-slate-400 max-w-xs truncate">{doc.description || '-'}</span>
        },
        {
            header: tTable('size'),
            cell: (doc) => <span className="text-slate-500 text-xs">{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
        },
        {
            header: tTable('date'),
            cell: (doc) => <span className="text-slate-500 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</span>
        },
        {
            header: tTable('actions'),
            cell: (doc) => (
                <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" asChild title={tTable('download')}>
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
                            {t('title')}
                        </h1>
                        <DataStateIndicator
                            isLoading={loading}
                            isError={!!listError}
                            isCached={docs && docs.length > 0}
                        />
                    </div >
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div >

                <Dialog open={modal.isOpen} onOpenChange={modal.setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => modal.openCreate()} className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" /> {tUpload('button')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{tUpload('title')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">{tUpload('file')}</Label>
                                <Input id="file" name="file" type="file" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{tUpload('description')}</Label>
                                <Input id="description" name="description" placeholder={tUpload('descriptionPlaceholder')} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => modal.close()}>{tUpload('cancel')}</Button>
                                <Button type="submit" disabled={uploading} className="bg-teal-600 hover:bg-teal-700">
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {tUpload('submit')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div >

            <ContentCard noPadding={true}>
                <DataTable
                    columns={columns}
                    data={docs || []}
                    isLoading={loading}
                    emptyMessage={tTable('empty')}
                />
            </ContentCard>
        </div >
    );
}
