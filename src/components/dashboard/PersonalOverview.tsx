"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles";
import { AuditMetrics } from "@/components/admin/AuditMetrics";
import { WorkflowTaskInbox } from "@/components/admin/WorkflowTaskInbox";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";
import { useApiItem } from "@/hooks/useApiItem";
import { ContentCard } from "@/components/ui/content-card";
import { Activity, AlertTriangle, CheckSquare, FileText, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface QuickStat {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

export function PersonalOverview() {
    const { data: session } = useSession();
    const userRole = session?.user?.role as UserRole;

    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
        return <AdminOverview />;
    }

    if (userRole === UserRole.TECHNICAL || userRole === UserRole.ENGINEERING) {
        return <TechnicianOverview />;
    }

    return null;
}

function AdminOverview() {
    const t = useTranslations("dashboard.stats");
    // Fetch generic admin stats
    const { data: dashboardData, isLoading } = useApiItem<any>({
        endpoint: '/api/user/dashboard',
    });

    const { data: auditStats } = useApiItem<any>({
        endpoint: '/api/admin/audit/stats',
    });

    return (
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="grid gap-6 md:grid-cols-2">
                {/* System Health Stats */}
                <ContentCard title={t("health_metrics")} icon={<Activity className="w-5 h-5 text-teal-600" />}>
                    <AuditMetrics
                        stats={auditStats || {
                            totalCases: dashboardData?.stats?.totalDocuments || 0,
                            performance: {
                                sla_violations_30d: 0,
                                rag_quality_avg: { avgFaithfulness: dashboardData?.stats?.accuracyRate ? dashboardData.stats.accuracyRate / 100 : 0.95 }
                            },
                            usage: {
                                tokens: dashboardData?.stats?.totalQueries * 150 || 0
                            }
                        }}
                        isLoading={isLoading}
                    />
                </ContentCard>

                {/* Recent Activity */}
                <ContentCard title={t("recent_activity")}>
                    <DashboardRecentActivity
                        activities={dashboardData?.activities || []}
                        t={(key: string) => key}
                    />
                </ContentCard>
            </div>
        </div>
    );
}

function TechnicianOverview() {
    const t = useTranslations("dashboard.stats");
    const [stats, setStats] = useState<QuickStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/user/dashboard");
                const data = await res.json();

                if (data.success) {
                    setStats([
                        {
                            label: t("pending_tasks"),
                            value: data.stats.pendingTasks || 0,
                            icon: <CheckSquare className="w-5 h-5" />,
                            color: "text-blue-600"
                        },
                        {
                            label: t("assigned_cases"),
                            value: data.stats.assignedCases || 0,
                            icon: <FileText className="w-5 h-5" />,
                            color: "text-teal-600"
                        },
                        {
                            label: t("active_alerts"),
                            value: data.stats.activeAlerts || 0,
                            icon: <AlertTriangle className="w-5 h-5" />,
                            color: "text-amber-600"
                        },
                        {
                            label: t("efficiency"),
                            value: `${data.stats.efficiency || 95}%`,
                            icon: <Zap className="w-5 h-5" />,
                            color: "text-emerald-600"
                        }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching dashboard:", error);
                // Silent fail/toast
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <ContentCard key={i} className="p-6 animate-pulse">
                            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
                        </ContentCard>
                    ))
                ) : (
                    stats.map((stat, i) => (
                        <ContentCard key={i} className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800", stat.color)}>
                                    {stat.icon}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-black text-foreground tabular-nums">
                                {stat.value}
                            </p>
                        </ContentCard>
                    ))
                )}
            </div>

            {/* Tasks Inbox */}
            <ContentCard title={t("priority_tasks")}>
                <WorkflowTaskInbox />
            </ContentCard>
        </div>
    );
}
