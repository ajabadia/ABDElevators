'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
    Search,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Prompt } from '@/lib/schemas';

/**
 * 📦 Extended Prompt Type with API metadata
 */
export type PromptWithInfo = Prompt & {
    _id?: string;
    tenantInfo?: {
        name: string;
        branding?: {
            logo?: {
                url: string;
            };
        };
    };
    _validationError?: boolean;
};

interface PromptListProps {
    prompts: PromptWithInfo[];
    loading: boolean;
    selectedPromptId?: string;
    onSelect: (prompt: PromptWithInfo) => void;
}

/**
 * 📋 PromptList Component
 * SRP: Responsable únicamente de renderizar la lista de prompts y sus estados (loading/empty).
 */
export function PromptList({
    prompts,
    loading,
    selectedPromptId,
    onSelect
}: PromptListProps) {
    const t = useTranslations('admin_prompts');

    if (loading) {
        return <LoadingState />;
    }

    if (prompts.length === 0) {
        return (
            <div className="p-20 text-center opacity-40 h-full flex flex-col items-center justify-center">
                <Search size={40} className="mx-auto mb-4" />
                <p className="text-sm font-bold tracking-tight">{t('messages.no_prompts')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-1 p-2">
            {prompts.map(p => (
                <div
                    key={p._id || p.key}
                    onClick={() => onSelect(p)}
                    className={cn(
                        "p-4 rounded-2xl cursor-pointer transition-all group relative flex items-center justify-between",
                        selectedPromptId === (p._id || p.key)
                            ? "bg-teal-600 shadow-md shadow-teal-500/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden border",
                            selectedPromptId === (p._id || p.key)
                                ? "bg-white/20 border-white/20"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        )}>
                            {p.tenantInfo?.branding?.logo?.url ? (
                                <img src={p.tenantInfo.branding.logo.url} alt={`Logo de ${p.tenantInfo.name}`} className="w-full h-full object-contain p-1" />
                            ) : (
                                <div className={cn(
                                    "w-full h-full flex items-center justify-center text-[10px] font-black uppercase",
                                    selectedPromptId === (p._id || p.key) ? "text-white" : "text-slate-400"
                                )}>
                                    {(p.tenantInfo?.name || p.tenantId).substring(0, 2)}
                                </div>
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h3 className={cn(
                                    "text-xs font-black tracking-tight flex items-center gap-1",
                                    selectedPromptId === (p._id || p.key) ? "text-white" : "text-slate-900 dark:text-white"
                                )}>
                                    {p.name}
                                    {p._validationError && (
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    )}
                                </h3>
                                <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                    selectedPromptId === (p._id || p.key) ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                )}>
                                    V{p.version}
                                </span>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] h-4 py-0",
                                    p.industry === 'ELEVATORS' ? "text-blue-500 border-blue-500/20" :
                                        p.industry === 'LEGAL' ? "text-purple-500 border-purple-500/20" :
                                            p.industry === 'BANKING' ? "text-emerald-500 border-emerald-500/20" :
                                                p.industry === 'INSURANCE' ? "text-rose-500 border-rose-500/20" :
                                                    "text-slate-500 border-slate-500/20"
                                )}>
                                    {p.industry || 'GENERIC'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={cn(
                                    "text-[10px] uppercase font-bold tracking-tighter opacity-50",
                                    selectedPromptId === (p._id || p.key) ? "text-white" : "text-slate-400 font-mono"
                                )}>
                                    {p.key}
                                </p>
                                <span className="text-[10px] opacity-20">|</span>
                                <p className={cn(
                                    "text-[10px] font-black tracking-widest text-teal-500",
                                    selectedPromptId === (p._id || p.key) ? "text-white/70" : ""
                                )}>
                                    {p.category}
                                </p>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className={cn(
                        "w-4 h-4 transition-all",
                        selectedPromptId === (p._id || p.key) ? "text-white" : "text-slate-300 group-hover:text-teal-400"
                    )} aria-hidden="true" />
                </div>
            ))}
        </div>
    );
}
