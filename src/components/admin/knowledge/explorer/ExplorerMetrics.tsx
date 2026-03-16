"use client";

import React from 'react';
import { Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

interface ExplorerMetricsProps {
    total: number;
    arch?: string;
    langs?: string[];
}

export function ExplorerMetrics({ total, arch, langs }: ExplorerMetricsProps) {
    const t = useTranslations('admin_knowledge');

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardDescription className="text-primary-foreground/70 font-medium">{t('stats.total')}</CardDescription>
                    <CardTitle className="text-3xl font-bold font-outfit">{(total || 0).toLocaleString()}</CardTitle>
                </CardHeader>
            </Card>
            <Card className="border-none shadow-sm bg-card">
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground font-medium">{t('stats.arch')}</CardDescription>
                    <CardTitle className="text-xl font-black text-teal-600 dark:text-teal-400 font-outfit flex items-center gap-2">
                        <Layers size={18} /> {arch || 'BGE-M3'}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card className="border-none shadow-sm bg-card">
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground font-medium">{t('stats.langs')}</CardDescription>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {(langs && langs.length > 0 ? langs : ['es', 'en', 'de', 'it', 'fr', 'pt']).map(lang => (
                            <Badge key={lang} variant="outline" className="text-[10px] uppercase font-bold bg-muted/50 border-border">
                                {lang}
                            </Badge>
                        ))}
                    </div>
                </CardHeader>
            </Card>
            <Card className="border-none shadow-sm bg-card">
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground font-medium">{t('stats.backend')}</CardDescription>
                    <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        {t('stats.synced')}
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
}
