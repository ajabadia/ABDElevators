"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface KnowledgeHealthCardProps {
    knowledge: any;
}

export function KnowledgeHealthCard({ knowledge }: KnowledgeHealthCardProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-slate-50/50 h-full">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sidebar-primary" />
                    {t('knowledge.title')}
                </CardTitle>
                <CardDescription>{t('knowledge.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{t('knowledge.obsolete')}</p>
                        <p className="text-xs text-muted-foreground">{t('knowledge.obsolete_desc')}</p>
                    </div>
                    <div className="text-right">
                        <Badge variant={knowledge?.obsoleteAssets > 0 ? "destructive" : "outline"} className={knowledge?.obsoleteAssets === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "font-bold"}>
                            {t('knowledge.pending', { count: knowledge?.obsoleteAssets || 0 })}
                        </Badge>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{t('knowledge.cluster_health')}</p>
                        <p className="text-xs text-muted-foreground">{t('knowledge.db_status')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-emerald-500 font-bold">{t('knowledge_health.auth_ok')}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
