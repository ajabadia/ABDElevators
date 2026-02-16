'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
    Sparkles,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Edit3,
    Hash,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from "@/components/ui/content-card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiMutation } from '@/hooks/useApiMutation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { KeyDebugModal } from './KeyDebugModal';
import { Info } from 'lucide-react';

interface TranslationMessage {
    value: string;
    source: 'local' | 'master' | 'tenant';
    isCustomized?: boolean;
}

interface TranslationTableProps {
    primaryLocale: string;
    secondaryLocale: string;
    primaryMessages: Record<string, TranslationMessage>;
    secondaryMessages: Record<string, TranslationMessage>;
    searchQuery: string;
    showMissingOnly: boolean;
    loading: boolean;
    hasActiveFilters: boolean;
    onRefresh: () => void;
}

export function TranslationTable({
    primaryLocale,
    secondaryLocale,
    primaryMessages,
    secondaryMessages,
    searchQuery,
    showMissingOnly,
    loading,
    hasActiveFilters,
    onRefresh
}: TranslationTableProps) {
    const tTable = useTranslations('admin.i18n.table');
    const tNotif = useTranslations('admin.i18n.notifications');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [editingLocale, setEditingLocale] = useState<string | null>(null);
    const [debugKey, setDebugKey] = useState<{ key: string; locale: string } | null>(null);
    const isBatchingRef = useRef(false);

    const updateMutation = useApiMutation<{ locale: string; translations: Record<string, string> }>({
        endpoint: (data) => `/api/admin/i18n/${data.locale}`,
        method: 'PATCH',
        onSuccess: () => {
            setEditingKey(null);
            setEditingLocale(null);
            onRefresh();
        }
    });

    const aiTranslateMutation = useApiMutation({
        endpoint: '/api/admin/i18n/auto-translate',
        method: 'POST',
        onSuccess: (data: any) => {
            onRefresh();
            // Si estamos en modo batch, no mostrar toast individual por cada chunk
            if (!isBatchingRef.current) {
                const count = data?.count || 0;
                toast.success(tNotif('aiSuccessTitle'), {
                    description: `${tNotif('aiSuccessDesc')} (${count} llaves procesadas)`
                });
            }
        },
        onError: (err) => {
            console.error('[i18n-ai] ❌ Error en autotraducción:', err);
            toast.error('Error de IA', {
                description: typeof err === 'string' ? err : 'No se pudo completar la traducción automática'
            });
        }
    });

    // Aplanar mensajes para la tabla (Ya vienen detallados de la API)
    const flatKeys = useMemo(() => {
        const keys = new Set([
            ...Object.keys(primaryMessages),
            ...Object.keys(secondaryMessages)
        ]);
        return Array.from(keys).sort();
    }, [primaryMessages, secondaryMessages]);

    const filteredKeys = flatKeys.filter(key => {
        const lowerSearch = searchQuery.toLowerCase();
        const pVal = primaryMessages[key]?.value?.toLowerCase() || '';
        const sVal = secondaryMessages[key]?.value?.toLowerCase() || '';

        // Filtro por búsqueda
        const matchesSearch = key.toLowerCase().includes(lowerSearch) ||
            pVal.includes(lowerSearch) ||
            sVal.includes(lowerSearch);

        if (!matchesSearch) return false;

        // Filtro por faltantes (si está activo, solo mostrar las que no existen en el idioma secundario)
        if (showMissingOnly) {
            return !secondaryMessages[key]?.value;
        }

        return true;
    });

    const handleEdit = (key: string, value: string, locale: string) => {
        setEditingKey(key);
        setTempValue(value);
        setEditingLocale(locale);
    };

    const handleAiTranslateSingle = (key: string) => {
        aiTranslateMutation.mutate({
            sourceLocale: primaryLocale,
            targetLocale: secondaryLocale,
            keys: [key]
        });
    };

    const handleSave = () => {
        if (!editingKey || !editingLocale) return;
        updateMutation.mutate({
            locale: editingLocale,
            translations: { [editingKey]: tempValue }
        });
    };

    const handleAiTranslateAllMissing = async () => {
        const missingKeys = filteredKeys.filter(key => !secondaryMessages[key]?.value);
        if (missingKeys.length === 0) {
            toast.info(tNotif('upToDateTitle'), { description: tNotif('upToDateDesc') });
            return;
        }

        const CHUNK_SIZE = 40;
        const totalChunks = Math.ceil(missingKeys.length / CHUNK_SIZE);
        const toastId = toast.loading(`Iniciando IA: 0/${missingKeys.length}...`, {
            style: { minWidth: '300px' }
        });

        isBatchingRef.current = true;
        let successfulCount = 0;

        try {
            for (let i = 0; i < missingKeys.length; i += CHUNK_SIZE) {
                const chunk = missingKeys.slice(i, i + CHUNK_SIZE);
                const currentBatchNumber = Math.floor(i / CHUNK_SIZE) + 1;

                toast.loading(
                    `Traduciendo lote ${currentBatchNumber}/${totalChunks} (${chunk.length} llaves)...`,
                    { id: toastId }
                );

                // IMPORTANTE: mutate es async en ABDElevators (useApiMutation)
                const result = await aiTranslateMutation.mutate({
                    sourceLocale: primaryLocale,
                    targetLocale: secondaryLocale,
                    keys: chunk
                });

                if (result?.success) {
                    successfulCount += (result.count || 0);
                } else {
                    console.warn(`Lote ${currentBatchNumber} falló. Deteniendo proceso.`);
                    toast.error(`Proceso interrumpido: El lote ${currentBatchNumber} falló.`, { id: toastId });
                    break;
                }

                if (i + CHUNK_SIZE < missingKeys.length) {
                    await new Promise(r => setTimeout(r, 12000));
                }
            }

            toast.success(`Traducción completada`, {
                id: toastId,
                description: `Se tradujeron ${successfulCount} llaves correctamente.`
            });
        } catch (error) {
            console.error('Error en batch:', error);
            toast.error('Error durante la traducción masiva', { id: toastId });
        } finally {
            isBatchingRef.current = false;
        }
    };

    return (
        <ContentCard noPadding className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="p-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest w-1/4">{tTable('keyHeader')}</th>
                            <th className="p-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest w-1/3">
                                {primaryLocale.toUpperCase()} ({tTable('primaryLabel')})
                            </th>
                            <th className="p-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest w-1/3 flex items-center justify-between">
                                <span>{secondaryLocale.toUpperCase()} ({tTable('secondaryLabel')})</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-[9px] font-black text-teal-600 hover:text-teal-500"
                                    onClick={handleAiTranslateAllMissing}
                                    disabled={aiTranslateMutation.isLoading}
                                >
                                    {aiTranslateMutation.isLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                        <Sparkles className="w-3 h-3 mr-1" />
                                    )}
                                    {tTable('autoTranslateBtn')} (IA)
                                </Button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={3} className="p-8 h-12 bg-slate-50/50"></td>
                                </tr>
                            ))
                        ) : filteredKeys.length > 0 ? (
                            filteredKeys.map(key => (
                                <tr key={key} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 group/key">
                                                <span className="text-[11px] font-mono font-bold text-foreground break-all">
                                                    {key}
                                                </span>
                                                <button
                                                    onClick={() => setDebugKey({ key, locale: primaryLocale })}
                                                    className="opacity-0 group-hover/key:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-teal-600"
                                                    title="Ver detalles técnicos y origen de la llave"
                                                >
                                                    <Info className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <Badge variant="outline" className="w-fit text-[8px] h-4 px-1.5 font-black uppercase opacity-50">
                                                {key.split('.')[0] || 'common'}
                                            </Badge>
                                        </div>
                                    </td>

                                    {/* Celda Primaria */}
                                    <td className="p-4 align-top">
                                        {editingKey === key && editingLocale === primaryLocale ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={tempValue}
                                                    onChange={e => setTempValue(e.target.value)}
                                                    className="text-xs h-9 rounded-xl border-teal-500"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="h-7 text-[10px] bg-teal-600" onClick={handleSave}>
                                                        {updateMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : tTable('save')}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingKey(null)}>{tTable('cancel')}</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex flex-col gap-1 group/cell"
                                                onClick={() => handleEdit(key, primaryMessages[key]?.value || '', primaryLocale)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span>{primaryMessages[key]?.value || <em className="text-muted-foreground/30">{tTable('empty')}</em>}</span>
                                                    <Edit3 className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                                </div>
                                                {primaryMessages[key] && (
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter",
                                                        primaryMessages[key]?.source === 'master' ? "text-blue-500" :
                                                            primaryMessages[key]?.source === 'tenant' ? "text-purple-500" :
                                                                "text-muted-foreground/40"
                                                    )}>
                                                        {primaryMessages[key]?.source}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Celda Secundaria */}
                                    <td className="p-4 align-top border-l border-border">
                                        {editingKey === key && editingLocale === secondaryLocale ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={tempValue}
                                                    onChange={e => setTempValue(e.target.value)}
                                                    className="text-xs h-9 rounded-xl border-teal-500"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="h-7 text-[10px] bg-teal-600" onClick={handleSave}>
                                                        {updateMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : tTable('save')}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingKey(null)}>{tTable('cancel')}</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={cn(
                                                    "text-xs cursor-pointer flex flex-col gap-1 group/cell",
                                                    secondaryMessages[key]?.value ? "text-muted-foreground" : "text-amber-500 font-bold"
                                                )}
                                                onClick={() => handleEdit(key, secondaryMessages[key]?.value || '', secondaryLocale)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span>
                                                        {secondaryMessages[key]?.value || (
                                                            <span className="flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" /> {tTable('missing')}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                        {!secondaryMessages[key]?.value && primaryMessages[key]?.value && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 text-teal-600 hover:bg-teal-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAiTranslateSingle(key);
                                                                }}
                                                                disabled={aiTranslateMutation.isLoading}
                                                                title="Traducir esta clave con IA"
                                                            >
                                                                <Sparkles className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                        <Edit3 className="w-3 h-3 text-muted-foreground/30 self-center" />
                                                    </div>
                                                </div>
                                                {secondaryMessages[key] && (
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter",
                                                        secondaryMessages[key]?.source === 'master' ? "text-blue-500" :
                                                            secondaryMessages[key]?.source === 'tenant' ? "text-purple-500" :
                                                                "text-muted-foreground/40"
                                                    )}>
                                                        {secondaryMessages[key]?.source}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : filteredKeys.length === 0 && !hasActiveFilters ? (
                            <tr>
                                <td colSpan={3} className="p-20 text-center">
                                    <Search size={48} className="mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Busca o filtra para comenzar
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Usa los filtros de namespace o la barra de búsqueda para cargar traducciones
                                    </p>
                                </td>
                            </tr>
                        ) : filteredKeys.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-20 text-center opacity-40">
                                    <Hash size={40} className="mx-auto mb-4" />
                                    <p className="text-sm font-bold">{tTable('noResults')}</p>
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
            {debugKey && (
                <KeyDebugModal
                    isOpen={!!debugKey}
                    onClose={() => setDebugKey(null)}
                    locale={debugKey.locale}
                    translationKey={debugKey.key}
                />
            )}
        </ContentCard>
    );
}

// Helper: Aplanar objeto anidado
function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj) return result;
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}
