import React from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { UsageBar } from "@/components/admin/UsageBar";

interface UsageSectionProps {
    stats: any;
    isSuperAdmin: boolean;
}

/**
 * Usage Section for Admin Dashboard (Phase 105 Hygiene)
 */
export const UsageSection: React.FC<UsageSectionProps> = ({ stats, isSuperAdmin }) => {
    const t = useTranslations('admin.dashboard');

    return (
        <ContentCard
            title={t('charts.consumptionTitle')}
            icon={<Zap className="text-teal-500" size={18} />}
            className="lg:col-span-2 shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
            <div className="space-y-8 p-2">
                <UsageBar
                    label={t('charts.labels.tokens')}
                    value={stats.usage.tokens}
                    max={isSuperAdmin ? 10_000_000 : stats.limits?.tokens || 1_000_000}
                    format="tokens"
                    color="teal"
                />
                <UsageBar
                    label={t('charts.labels.storage')}
                    value={stats.usage.storage}
                    max={isSuperAdmin ? 100 * 1024 * 1024 * 1024 : stats.limits?.storage || 5 * 1024 * 1024 * 1024}
                    format="bytes"
                    color="blue"
                />
                <UsageBar
                    label={t('charts.labels.searches')}
                    value={stats.usage.searches}
                    max={isSuperAdmin ? 50_000 : stats.limits?.searches || 5_000}
                    format="count"
                    color="purple"
                />
            </div>
        </ContentCard>
    );
};
