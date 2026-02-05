'use client';

import React, { useState, useMemo } from 'react';
import {
    Sparkles,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Edit3,
    Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from "@/components/ui/content-card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiMutation } from '@/hooks/useApiMutation';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface TranslationTableProps {
    primaryLocale: string;
    secondaryLocale: string;
    primaryMessages: Record<string, any>;
    secondaryMessages: Record<string, any>;
    searchQuery: string;
    loading: boolean;
    onRefresh: () => void;
}

export function TranslationTable({
    primaryLocale,
    secondaryLocale,
    primaryMessages,
    secondaryMessages,
    searchQuery,
    loading,
    onRefresh
}: TranslationTableProps) {
    const tTable = useTranslations('admin.i18n.table');
    const tNotif = useTranslations('admin.i18n.notifications');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [editingLocale, setEditingLocale] = useState<string | null>(null);

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
        onSuccess: () => {
            onRefresh();
            toast({ title: tNotif('aiSuccessTitle'), description: tNotif('aiSuccessDesc') });
        }
    });

    // Aplanar mensajes para la tabla
    const flatKeys = useMemo(() => {
        const keys = new Set([
            ...Object.keys(nestToFlat(primaryMessages)),
            ...Object.keys(nestToFlat(secondaryMessages))
        ]);
        return Array.from(keys).sort();
    }, [primaryMessages, secondaryMessages]);

    const primaryFlat = useMemo(() => nestToFlat(primaryMessages), [primaryMessages]);
    const secondaryFlat = useMemo(() => nestToFlat(secondaryMessages), [secondaryMessages]);

    const filteredKeys = flatKeys.filter(key => {
        const lowerSearch = searchQuery.toLowerCase();
        return (
            key.toLowerCase().includes(lowerSearch) ||
            (primaryFlat[key] && primaryFlat[key].toLowerCase().includes(lowerSearch)) ||
            (secondaryFlat[key] && secondaryFlat[key].toLowerCase().includes(lowerSearch))
        );
    });

    const handleEdit = (key: string, value: string, locale: string) => {
        setEditingKey(key);
        setTempValue(value);
        setEditingLocale(locale);
    };

    const handleSave = () => {
        if (!editingKey || !editingLocale) return;
        updateMutation.mutate({
            locale: editingLocale,
            translations: { [editingKey]: tempValue }
        });
    };

    const handleAiTranslateAllMissing = () => {
        const missingKeys = filteredKeys.filter(key => !secondaryFlat[key]);
        if (missingKeys.length === 0) {
            toast({ title: tNotif('upToDateTitle'), description: tNotif('upToDateDesc') });
            return;
        }

        aiTranslateMutation.mutate({
            sourceLocale: primaryLocale,
            targetLocale: secondaryLocale,
            keys: missingKeys.slice(0, 50) // Limitar a 50 por seguridad
        });
    };

    return (
        <ContentCard noPadding className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest w-1/4">{tTable('keyHeader')}</th>
                            <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest w-1/3">
                                {primaryLocale.toUpperCase()} ({tTable('primaryLabel')})
                            </th>
                            <th className="p-4 text-[10px] uppercase font-black text-slate-500 tracking-widest w-1/3 flex items-center justify-between">
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
                                    {tTable('autoTranslateBtn')}
                                </Button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                            <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-300 break-all">
                                                {key}
                                            </span>
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
                                                className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 flex justify-between group/cell"
                                                onClick={() => handleEdit(key, primaryFlat[key] || '', primaryLocale)}
                                            >
                                                <span>{primaryFlat[key] || <em className="text-slate-300">{tTable('empty')}</em>}</span>
                                                <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </td>

                                    {/* Celda Secundaria */}
                                    <td className="p-4 align-top border-l border-slate-100 dark:border-slate-800">
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
                                                    "text-xs cursor-pointer flex justify-between group/cell",
                                                    secondaryFlat[key] ? "text-slate-600 dark:text-slate-400" : "text-amber-500 font-bold"
                                                )}
                                                onClick={() => handleEdit(key, secondaryFlat[key] || '', secondaryLocale)}
                                            >
                                                <span>
                                                    {secondaryFlat[key] || (
                                                        <span className="flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> {tTable('missing')}
                                                        </span>
                                                    )}
                                                </span>
                                                <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="p-20 text-center opacity-40">
                                    <Hash size={40} className="mx-auto mb-4" />
                                    <p className="text-sm font-bold">{tTable('noResults')}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
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
