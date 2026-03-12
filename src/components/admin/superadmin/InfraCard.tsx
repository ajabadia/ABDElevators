"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InfraCardProps {
    system?: {
        environment: string;
        dbTier: string;
        aiEngine: string;
    };
}

export function InfraCard({ system }: InfraCardProps) {
    const t = useTranslations('admin_superadmin');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative h-full">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Server className="w-32 h-32" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tighter">{t('infra.title')}</CardTitle>
                <CardDescription className="text-indigo-200">{t('infra.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.environment')}</span>
                    <p className="text-sm font-bold">{system?.environment || t('infra.environment_val')}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.db_tier')}</span>
                    <p className="text-sm font-bold">{system?.dbTier || t('infra.db_multi_cluster')}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.ai_engine')}</span>
                    <p className="text-sm font-bold">{system?.aiEngine || t('infra.ai_engine_val')}</p>
                </div>
            </CardContent>
        </Card>
    );
}
