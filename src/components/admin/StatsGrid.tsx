import React from "react";
import { useTranslations } from "next-intl";
import { Building2, FileText, ShieldCheck, Search } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface StatsGridProps {
    stats: any;
    isSuperAdmin: boolean;
    isCompact?: boolean;
}

/**
 * Quick Stats Grid for Admin Dashboard (Phase 105 Hygiene)
 */
export const StatsGrid: React.FC<StatsGridProps> = ({ stats, isSuperAdmin, isCompact }) => {
    const t = useTranslations('admin.dashboard');

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-${isCompact ? '3' : '6'}`}>
            <MetricCard
                title={isSuperAdmin ? t('metrics.tenants') : t('metrics.activeUsers')}
                value={isSuperAdmin ? stats.totalTenants : (stats as any).totalUsers || 0}
                icon={<Building2 />}
                trend="+12%"
                trendDirection="up"
                color="blue"
                className={isCompact ? "p-4" : ""}
            />
            <MetricCard
                title={t('metrics.documents')}
                value={stats.totalFiles}
                icon={<FileText />}
                trend="+5.4%"
                trendDirection="up"
                color="amber"
                className={isCompact ? "p-4" : ""}
            />
            <MetricCard
                title={t('metrics.cases')}
                value={stats.totalCases}
                icon={<ShieldCheck />}
                trend="+18%"
                trendDirection="up"
                color="emerald"
                className={isCompact ? "p-4" : ""}
            />
            <MetricCard
                title={t('metrics.iaSearches')}
                value={stats.usage.searches}
                icon={<Search />}
                trend="+24%"
                trendDirection="up"
                color="purple"
                className={isCompact ? "p-4" : ""}
            />
        </div>
    );
};
