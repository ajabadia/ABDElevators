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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiFileUpload } from "@/hooks/useApiFileUpload";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { useFormModal } from "@/hooks/useFormModal";

interface PersonalDocument {
    _id: string;
    originalName: string;
    description?: string;
    createdAt: string;
    sizeBytes: number;
    cloudinaryUrl: string;
}

export default function MyDocumentsPage() {
    const t = useTranslations('myDocuments');
    const tUpload = useTranslations('myDocuments.upload');
    const tTable = useTranslations('myDocuments.table');
    const tStorage = useTranslations('myDocuments.storage');
    const [searchTerm, setSearchTerm] = useState("");
    const [description, setDescription] = useState("");
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Fetching con useApiList
    const {
        data: documents,
        isLoading,
        refresh,
        setData
    } = useApiList<PersonalDocument>({
        endpoint: '/api/auth/knowledge-assets',
        filters: { search: searchTerm },
    });

    // 2. Optimismo UI
    const { deleteOptimistic, addOptimistic } = useApiOptimistic(documents, setData);

    // 3. Modales y Carga
    const uploadModal = useFormModal({
        onClose: () => {
            setFile(null);
            setDescription("");
            setDocumentTypeId("");
        }
    });

    const { upload, isUploading, progress } = useApiFileUpload({
        endpoint: '/api/auth/knowledge-assets',
        onSuccess: () => {
            toast.success(tUpload('successTitle'), {
                description: tUpload('successDesc'),
            });
            uploadModal.close();
            refresh();
        },
        onError: (err) => {
            toast.error(t('error') || 'Error', {
                description: err,
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/auth/knowledge-assets/${id}`,
        method: 'DELETE',
        confirmMessage: t('confirmDelete'),
        onSuccess: () => {
            toast.success(t('deleteSuccessTitle'), {
                description: t('deleteSuccess'),
            });
            refresh();
        },
        onError: (err) => {
            toast.error(t('error') || 'Error', {
                description: err,
            });
        }
    });

    useEffect(() => {
        setIsMounted(true);
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/admin/document-types?category=USER_DOCUMENT');
                if (res.ok) {
                    const data = await res.json();
                    setDocumentTypes(data);
                }
            } catch (error) {
                console.error('Error fetching document types:', error);
            }
        };
        fetchTypes();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        await upload(file, { description, documentTypeId });
    };

    const handleDelete = async (id: string) => {
        const original = [...documents];
        deleteOptimistic(id);
        try {
            await deleteMutation.mutate(id);
        } catch (error) {
            setData(original);
        }
    };

    const filteredDocs = documents;

    if (!isMounted || (isLoading && documents.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                <Loader2 className="animate-spin mb-4 h-10 w-10 text-teal-600" />
                <p className="animate-pulse">{tTable('loadingRepo')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title={t('titleAlt')}
                subtitle={t('subtitleAlt')}
                helpId="documents-status"
                actions={
                    <Button
                        onClick={() => uploadModal.openCreate()}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                    >
                        <Plus size={18} />
                        {tUpload('button')}
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 border-none shadow-md bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">{tStorage('title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <HardDrive className="text-teal-400" size={24} />
                            <div>
                                <p className="text-2xl font-bold">{documents.length}</p>
                                <p className="text-xs text-slate-500">{tStorage('totalFiles')}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-teal-500 h-full w-[15%]"></div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">{tStorage('usage', { used: '0.8', total: '5' })}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-none shadow-lg">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder={t('search')}
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
                                <p>{tTable('loading')}</p>
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <FileIcon size={48} className="mb-4 opacity-20" />
                                <p>{tTable('noResults')}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">{tTable('file')}</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">{tTable('date')}</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-slate-100">{tTable('size')}</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-100">{tTable('actions')}</TableHead>
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
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{doc.originalName}</p>
                                                        <div className="flex gap-2 items-center mt-1">
                                                            {(doc as any).documentTypeName && (
                                                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-teal-50 text-teal-700 border-teal-200">
                                                                    {(doc as any).documentTypeName}
                                                                </Badge>
                                                            )}
                                                            {doc.description && (
                                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock size={12} />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-teal-600"
                                                        asChild
                                                    >
                                                        <a href={doc.cloudinaryUrl} target="_blank" rel="noopener noreferrer" download={doc.originalName}>
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
                        <DialogTitle>{tUpload('title')}</DialogTitle>
                        <DialogDescription>
                            {tUpload('successDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo">{tUpload('type')}</Label>
                            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                                <SelectTrigger id="tipo" className="border-slate-200">
                                    <SelectValue placeholder={tUpload('typePlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map((t) => (
                                        <SelectItem key={t._id} value={t._id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">{tUpload('filePdf')}</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                required
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">{tUpload('description')}</Label>
                            <Input
                                id="desc"
                                placeholder={tUpload('descriptionPlaceholder')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => uploadModal.close()}>
                                {tUpload('cancel')}
                            </Button>
                            <Button type="submit" disabled={isUploading || !file} className="bg-teal-600 hover:bg-teal-700">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {tUpload('uploading')}
                                    </>
                                ) : tUpload('save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
