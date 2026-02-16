'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApiMutation } from '@/hooks/useApiMutation';
import { Loader2, Plus, Hash } from 'lucide-react';

interface CreateI18nKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    locale: string;
}

export function CreateI18nKeyModal({
    isOpen,
    onClose,
    onSuccess,
    locale
}: CreateI18nKeyModalProps) {
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        namespace: 'common',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useApiMutation({
        endpoint: '/api/admin/i18n',
        method: 'POST',
        onSuccess: () => {
            setFormData({ key: '', value: '', namespace: 'common' });
            onSuccess();
            onClose();
        },
        successMessage: 'Llave creada correctamente.'
    });

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.key.length < 3) newErrors.key = 'La llave debe tener al menos 3 caracteres';
        if (!/^[a-zA-Z0-9._-]+$/.test(formData.key)) newErrors.key = 'La llave debe contener solo letras, números, puntos, guiones o guiones bajos';
        if (formData.value.length < 1) newErrors.value = 'El valor es requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        createMutation.mutate({
            ...formData,
            locale,
            namespace: formData.namespace || formData.key.split('.')[0] || 'common'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-teal-600" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Nueva Llave i18n</DialogTitle>
                    <DialogDescription>
                        Crea una nueva llave de traducción para el idioma <span className="font-bold uppercase text-teal-600">{locale}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Llave (ID)</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="ej: common.navigation.home"
                                    className={`pl-10 h-11 rounded-xl border-slate-200 focus:ring-teal-500 ${errors.key ? 'border-red-500' : ''}`}
                                    value={formData.key}
                                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                />
                            </div>
                            {errors.key && <p className="text-[10px] text-red-500 mt-1">{errors.key}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Valor Inicial ({locale.toUpperCase()})</Label>
                            <Input
                                placeholder="ej: Inicio"
                                className={`h-11 rounded-xl border-slate-200 focus:ring-teal-500 ${errors.value ? 'border-red-500' : ''}`}
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            />
                            {errors.value && <p className="text-[10px] text-red-500 mt-1">{errors.value}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Namespace</Label>
                            <Input
                                placeholder="ej: common"
                                className="h-11 rounded-xl border-slate-200 focus:ring-teal-500"
                                value={formData.namespace}
                                onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isLoading}
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/10 min-w-[120px]"
                        >
                            {createMutation.isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Crear Llave
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
