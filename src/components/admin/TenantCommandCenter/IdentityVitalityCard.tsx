"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Building2, HardDrive, ArrowUpRight } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface IdentityVitalityCardProps {
    stats: any;
    isSuperAdmin: boolean;
}

/**
 * Block 1: Identity & Vitality (NW)
 * Shows tenant branding and critical storage "Vitals".
 */
export const IdentityVitalityCard: React.FC<IdentityVitalityCardProps> = ({ stats, isSuperAdmin }) => {
    const t = useTranslations('admin_analytics');

    const storageUsage = stats.usage?.storage || 0;
    const storageLimit = stats.limits?.storage || (5 * 1024 * 1024 * 1024);
    const storagePercent = Math.min(100, Math.round((storageUsage / storageLimit) * 100));

    // Format bytes to humanoid string
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <ContentCard
            title={stats.name || t('commandCenter.identity.title')}
            icon={<Building2 className="text-blue-500" size={18} />}
            className="h-full border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all"
        >
            <div className="flex flex-col h-full justify-between gap-6 p-1">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                                {stats.tier || "FREE"}
                            </Badge>
                            {isSuperAdmin && <Badge variant="outline">SUPERADMIN VIEW</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                            {stats.industry || "General Industry"}
                        </p>
                    </div>
                    {stats.logo && (
                        <img src={stats.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-50 p-1 border" />
                    )}
                </div>

                <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <HardDrive size={14} className="text-blue-500" />
                            <span>{t('charts.labels.storage')}</span>
                        </div>
                        <span className="font-mono text-xs">{storagePercent}%</span>
                    </div>

                    <Progress value={storagePercent} className="h-2 bg-slate-200" />

                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{formatBytes(storageUsage)} used</span>
                        <span>{formatBytes(storageLimit)} limit</span>
                    </div>
                </div>

                <Link
                    href="/admin/billing"
                    className="group flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    {t('billing.managePlan') || "Manage Subscription"}
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>
        </ContentCard>
    );
};
