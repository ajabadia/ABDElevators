"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TopTenantsCardProps {
    usage?: any;
}

export function TopTenantsCard({ usage }: TopTenantsCardProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-sidebar-primary" />
                        {t('usage.title')}
                    </CardTitle>
                    <CardDescription>{t('usage.desc')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {usage?.topTenants?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {usage.topTenants.map((tenant: any) => (
                                <div key={tenant.tenantId} className="group p-4 rounded-3xl bg-white border border-slate-100 hover:border-sidebar-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {tenant.tenantId.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{tenant.tenantId}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">{t('usage.tokens')}: {tenant.tokens?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-700">{(tenant.storage / (1024 * 1024)).toFixed(1)} MB</p>
                                                <p className="text-[9px] text-muted-foreground uppercase">{t('usage.storage')}</p>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-emerald-600">+{tenant.savings?.toLocaleString()}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase">{t('usage.savings')}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="group-hover:text-sidebar-primary">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm italic">
                            {t('usage.no_data')}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
