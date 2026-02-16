"use client";

import React from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { ActivityRow } from "@/components/admin/ActivityRow";

interface DashboardRecentActivityProps {
    activities: any[];
    t: any;
}

export function DashboardRecentActivity({ activities, t }: DashboardRecentActivityProps) {
    return (
        <div className="mt-8">
            <ContentCard
                title={t('activity.title')}
                icon={<Activity className="text-teal-500" size={18} />}
                noPadding
                className="shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
                <div className="divide-y divide-border">
                    {activities && activities.length > 0 ? (
                        activities.map((act: any, idx: number) => (
                            <ActivityRow key={act._id || idx} activity={act} />
                        ))
                    ) : (
                        <div className="p-20 text-center flex flex-col items-center gap-4 text-muted-foreground">
                            <ShieldCheck size={48} className="opacity-10" />
                            <p className="text-sm font-bold tracking-tight opacity-50 uppercase tracking-[0.2em]">{t('activity.empty')}</p>
                        </div>
                    )}
                </div>
            </ContentCard>
        </div>
    );
}
