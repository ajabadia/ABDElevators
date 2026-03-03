"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, ShieldCheck, Clock, Box } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PlaybookExecutionsWidgetProps {
    playbookData: any;
    isLoading: boolean;
}

export function PlaybookExecutionsWidget({ playbookData, isLoading }: PlaybookExecutionsWidgetProps) {
    const t = useTranslations('admin_superadmin.playbooks');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-slate-50/50 h-full">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-sidebar-primary" />
                        {t('title')}
                    </div>
                    {playbookData?.playbooks?.length > 0 && (
                        <Badge variant="outline" className="bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20">
                            {playbookData.playbooks.length}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>{t('desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)
                ) : !playbookData?.playbooks || playbookData.playbooks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{t('no_executions')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {playbookData.playbooks.map((pb: any) => (
                            <div key={pb.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-50">
                                        <Box className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-slate-800">
                                                {t(`actions.${pb.action}`) || pb.action}
                                            </p>
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                                {pb.tenantId}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                            {pb.message}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground justify-end">
                                        <Clock className="w-3 h-3" />
                                        {new Date(pb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <p className="text-[9px] font-medium text-green-600 mt-0.5">SUCCESS</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
