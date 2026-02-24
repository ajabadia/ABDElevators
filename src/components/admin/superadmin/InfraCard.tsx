"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function InfraCard() {
    const t = useTranslations('admin.superadmin');

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
                    <p className="text-sm font-bold">PRODUCTION / VERCEL</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.db_tier')}</span>
                    <p className="text-sm font-bold">M10 / Dedicated Cluster</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.ai_engine')}</span>
                    <p className="text-sm font-bold">Gemini 004 / Pro Advanced</p>
                </div>
            </CardContent>
        </Card>
    );
}
