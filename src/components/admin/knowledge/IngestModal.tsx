'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Loader2, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface IngestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function IngestModal({ open, onOpenChange, onSuccess }: IngestModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [docTypes, setDocTypes] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        file: null as File | null,
        type: '',
        version: '1.0',
        documentTypeId: '',
        scope: 'TENANT' as 'GLOBAL' | 'INDUSTRY' | 'TENANT',
        industry: 'GENERIC',
        description: ''
    });

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (open) {
            fetchDocTypes();
        }
    }, [open]);

    const fetchDocTypes = async () => {
        try {
            const res = await fetch('/api/admin/document-types');
            const data = await res.json();
            if (data.success) {
                setDocTypes(data.items);
                if (data.items.length > 0 && !formData.documentTypeId) {
                    setFormData(prev => ({ ...prev, documentTypeId: data.items[0]._id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch doc types:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                toast.error('Solo se permiten archivos PDF');
                return;
            }
            setFormData(prev => ({ ...prev, file }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.file) {
            toast.error('Debes seleccionar un archivo PDF');
            return;
        }
        if (!formData.type || !formData.version) {
            toast.error('Completa los campos obligatorios');
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('file', formData.file);
        data.append('type', formData.type);
        data.append('version', formData.version);
        data.append('documentTypeId', formData.documentTypeId);
        data.append('scope', formData.scope);
        data.append('industry', formData.industry);
        data.append('description', formData.description);

        try {
            const res = await fetch('/api/admin/ingest', {
                method: 'POST',
                body: data,
            });

            const result = await res.json();

            if (res.ok) {
                toast.success('Documento encolado para ingesta correctamente');
                onSuccess?.();
                onOpenChange(false);
                setFormData({
                    file: null,
                    type: '',
                    version: '1.0',
                    documentTypeId: '',
                    scope: 'TENANT',
                    industry: 'GENERIC',
                    description: ''
                });
            } else {
                toast.error(result.message || 'Error al procesar la ingesta');
            }
        } catch (error) {
            toast.error('Error de red al intentar la ingesta');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <UploadCloud className="w-6 h-6 text-primary" />
                        Ingestar Documento RAG
                    </DialogTitle>
                    <DialogDescription>
                        Sube un archivo técnico para procesarlo y añadirlo a la Base de Conocimiento.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4">
                        {/* File Upload Area */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                id="file-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".pdf"
                            />
                            {formData.file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    <span className="text-sm font-medium">{formData.file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <FileText className="w-10 h-10" />
                                    <span className="text-sm">Haz clic o arrastra un PDF aquí</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Componente *</Label>
                                <Input
                                    id="type"
                                    placeholder="ej: Ascensor, Inverter"
                                    value={formData.type}
                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="version">Versión *</Label>
                                <Input
                                    id="version"
                                    placeholder="ej: 1.0, v2"
                                    value={formData.version}
                                    onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="docType">Clasificación de Documento</Label>
                            <Select
                                value={formData.documentTypeId}
                                onValueChange={val => setFormData(prev => ({ ...prev, documentTypeId: val }))}
                            >
                                <SelectTrigger id="docType">
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {docTypes.map(t => (
                                        <SelectItem key={t._id} value={t._id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Scopes (SuperAdmin Only) */}
                        {isSuperAdmin && (
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scope">Alcance (Scope)</Label>
                                    <Select
                                        value={formData.scope}
                                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, scope: val }))}
                                    >
                                        <SelectTrigger id="scope">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TENANT">Tenant Local</SelectItem>
                                            <SelectItem value="INDUSTRY">Industria</SelectItem>
                                            <SelectItem value="GLOBAL">Global / Compartido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.scope === 'INDUSTRY' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industria</Label>
                                        <Select
                                            value={formData.industry}
                                            onValueChange={val => setFormData(prev => ({ ...prev, industry: val }))}
                                        >
                                            <SelectTrigger id="industry">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ELEVATORS">Ascensores</SelectItem>
                                                <SelectItem value="LEGAL">Legal</SelectItem>
                                                <SelectItem value="MEDICAL">Médico</SelectItem>
                                                <SelectItem value="BANKING">Banca</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción Opcional</Label>
                            <Textarea
                                id="description"
                                placeholder="Notas adicionales sobre este activo..."
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="resize-none"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                'Iniciar Ingesta'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
