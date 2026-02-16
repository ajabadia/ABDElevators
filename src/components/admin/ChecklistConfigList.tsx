"use client";

import React from 'react';
import Link from 'next/link';
import { ChecklistConfig } from '@/lib/schemas';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useApiList } from '@/hooks/useApiList';
import { useApiMutation } from '@/hooks/useApiMutation';
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useTranslations } from 'next-intl';

/**
 * ChecklistConfigList – Dashboard para visualizar y gestionar las configuraciones
 * de checklists dinámicos.
 */
export const ChecklistConfigList: React.FC = () => {
    const t = useTranslations('admin.checklists');

    // 1. Carga de datos con hook genérico
    const { data: configs, isLoading, refresh } = useApiList<ChecklistConfig>({
        endpoint: '/api/admin/checklist-configs',
        dataKey: 'configs'
    });

    // 2. Acción de eliminación con hook genérico
    const { mutate: deleteConfig } = useApiMutation({
        endpoint: (id: string) => `/api/admin/checklist-configs/${id}`,
        method: 'DELETE',
        confirmMessage: (id: string) => {
            const config = configs?.find(c => String(c._id) === id);
            return t('mutation.confirm_delete', { name: config?.name || id });
        },
        successMessage: t('mutation.delete_success'),
        onSuccess: () => refresh()
    });

    // 3. Definición de columnas
    const columns = [
        {
            header: t('table.name'),
            cell: (config: ChecklistConfig) => (
                <div role="rowheader">
                    <div className="font-bold text-slate-900 dark:text-white">{config.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5" aria-hidden="true">
                        {new Date(config.updatedAt).toLocaleString()}
                    </div>
                </div>
            )
        },
        {
            header: t('table.categories'),
            cell: (config: ChecklistConfig) => (
                <div className="flex gap-1 flex-wrap max-w-xs" aria-label={t('table.categories')}>
                    {config.categories.slice(0, 3).map(cat => (
                        <span
                            key={cat.id}
                            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border"
                            style={{
                                backgroundColor: `${cat.color}15`,
                                borderColor: `${cat.color}40`,
                                color: cat.color
                            }}
                        >
                            {cat.name}
                        </span>
                    ))}
                    {config.categories.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold px-1 py-0.5">
                            +{config.categories.length - 3}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: t('table.status'),
            cell: (config: ChecklistConfig) => (
                config.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 h-6">
                        <CheckCircle size={10} />
                        {t('table.active')}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-slate-400 gap-1.5 h-6">
                        <XCircle size={10} />
                        {t('table.inactive')}
                    </Badge>
                )
            )
        },
        {
            header: t('table.actions'),
            className: 'text-right',
            cell: (config: ChecklistConfig) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 rounded-full hover:bg-teal-50 hover:text-teal-600 transition-all"
                        aria-label={`${t('table.actions')}: ${t('table.name')} ${config.name}`}
                    >
                        <Link href={`/admin/checklist-configs/${config._id}`}>
                            <Edit size={14} />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteConfig(String(config._id))}
                        className="h-8 w-8 p-0 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all text-slate-400"
                        aria-label={`${t('table.actions')}: Remove ${config.name}`}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('title')}</h2>
                    <p className="text-xs text-slate-500 font-medium">{t('subtitle')}</p>
                </div>
                <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/20 rounded-xl">
                    <Link href="/admin/checklist-configs/new">
                        <Plus size={18} />
                        {t('new_config')}
                    </Link>
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={configs}
                isLoading={isLoading}
                emptyMessage={t('empty_message')}
                className="shadow-xl shadow-slate-200/50"
            />
        </div>
    );
};
