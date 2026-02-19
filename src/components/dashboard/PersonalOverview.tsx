"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles";
import { AuditMetrics } from "@/components/admin/AuditMetrics";
import { WorkflowTaskInbox } from "@/components/admin/WorkflowTaskInbox";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";
import { useApiItem } from "@/hooks/useApiItem";
import { ContentCard } from "@/components/ui/content-card";
import { Activity, AlertTriangle, CheckSquare, FileText, Zap, TrendingUp, Clock, ShieldCheck } from "lucide-react";
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
            {/* Business Metrics Section - FASE 195.3 */}
            <BusinessMetrics />

            {/* Tasks Inbox */}
            <ContentCard title={t("priority_tasks")}>
                <WorkflowTaskInbox />
            </ContentCard>
        </div>
    );
}

function BusinessMetrics() {
    const t = useTranslations("dashboard");
    const { data: valueData, isLoading } = useApiItem<any>({
        endpoint: '/api/dashboard/value-metrics',
    });

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700" />
            ))}
        </div>
    );

    const metrics = [
        {
            label: t("metrics.analyzed"),
            value: valueData?.metrics?.analyzed || 0,
            icon: <FileText className="w-5 h-5" />,
            color: "text-blue-500",
            trend: valueData?.metrics?.weeklyGrowth || "+0%"
        },
        {
            label: t("metrics.time_saved"),
            value: `${valueData?.metrics?.timeSavedHours || 0}h`,
            icon: <Clock className="w-5 h-5" />,
            color: "text-emerald-500",
            trend: "Ahorro total"
        },
        {
            label: t("metrics.confidence"),
            value: valueData?.metrics?.trustRatio || "0%",
            icon: <ShieldCheck className="w-5 h-5" />,
            color: "text-amber-500",
            trend: "Calidad RAG"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {metrics.map((m, i) => (
                <ContentCard key={i} className="relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-slate-800", m.color)}>
                            {m.icon}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            {m.trend}
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{m.label}</p>
                        <p className="text-3xl font-black text-foreground mt-1 tabular-nums">{m.value}</p>
                    </div>
                </ContentCard>
            ))}
        </div>
    );
}
