"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    ExternalLink
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface MultiTenantHealthGridProps {
    tenants: any[];
}

/**
 * 🏢 Multi-Tenant Health Grid Component (Phase 268)
 * Displays a traffic light overview of all tenants.
 */
export function MultiTenantHealthGrid({ tenants }: MultiTenantHealthGridProps) {
    const t = useTranslations('admin_superadmin');

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'HEALTHY': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'WARNING': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'CRITICAL': return 'text-red-500 bg-red-50 border-red-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getHealthIcon = (status: string) => {
        switch (status) {
            case 'HEALTHY': return <ShieldCheck className="w-4 h-4" />;
            case 'WARNING': return <ShieldAlert className="w-4 h-4" />;
            case 'CRITICAL': return <ShieldX className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-sidebar-primary" />
                    {t('gov.health_grid_title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tenants?.map((tenant) => (
                        <div
                            key={tenant.tenantId}
                            className="p-4 rounded-3xl border border-slate-100 hover:border-sidebar-primary/20 hover:shadow-lg transition-all space-y-4 group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                                        {tenant.tenantId}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] py-0 px-2 flex items-center gap-1 font-medium ${getHealthColor(tenant.healthStatus)}`}
                                    >
                                        {getHealthIcon(tenant.healthStatus)}
                                        {t(`gov.status.${tenant.healthStatus.toLowerCase()}`)}
                                    </Badge>
                                </div>
                                <Link href={`/admin/organizations/tenants/${tenant.tenantId}`}>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </div>
                                </Link>
                            </div>

                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                                <div className="space-y-0.5">
                                    <p>{t('usage.tokens')}</p>
                                    <p className="text-slate-700">{tenant.tokens?.toLocaleString()}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p>{t('usage.savings')}</p>
                                    <p className="text-emerald-600">+{tenant.savings?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!tenants?.length && (
                        <div className="col-span-full text-center py-8 text-muted-foreground italic text-sm">
                            {t('usage.no_data')}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
