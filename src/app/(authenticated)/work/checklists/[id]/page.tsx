"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConfiguratorFull } from '@/verticals/elevators/components/configurator/ConfiguratorFull';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ChecklistConfig } from '@/lib/schemas';
import { useApiItem } from '@/hooks/useApiItem';

export default function ChecklistEditorPage() {
    const t = useTranslations('admin.checklists.editor');
    const params = useParams();
    if (!params) return null;

    const id = params.id as string;
    const isNew = id === 'new';

    const { data: config, isLoading, error } = useApiItem<ChecklistConfig>({
        endpoint: `/api/admin/checklist-configs/${id}`,
        autoFetch: !isNew,
        dataKey: 'config'
    });

    if (isLoading && !isNew) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
                <div className="relative">
                    <Loader2 className="animate-spin text-teal-500" size={64} />
                    <div className="absolute inset-0 blur-2xl bg-teal-500/20 animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold mt-8 tracking-widest uppercase text-xs">
                    {t('loading')}
                </p>
            </div>
        );
    }

    if (error || (!config && !isNew && !isLoading)) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] p-6 text-center">
                <AlertCircle className="text-red-500 mb-6" size={64} />
                <h2 className="text-3xl font-black text-white mb-2">{t('error_title')}</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    {error || t('error_desc')}
                </p>
                <Link
                    href="/admin/checklist-configs"
                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700 shadow-xl"
                >
                    {t('back_button')}
                </Link>
            </div>
        );
    }

    return <ConfiguratorFull initialConfig={config || undefined} isNew={isNew} />;
}
