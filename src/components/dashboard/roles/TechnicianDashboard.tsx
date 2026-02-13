"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { WorkflowTaskInbox } from "@/components/admin/WorkflowTaskInbox";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckSquare, FileText, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickStat {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

export default function TechnicianDashboard() {
    const t = useTranslations("dashboard"); // Ensure translations exist or fallback
    const { data: session } = useSession();
    const [stats, setStats] = useState<QuickStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Reusing existing endpoint for now, or create a specific one
            const res = await fetch("/api/user/dashboard");
            const data = await res.json();

            if (data.success) {
                // Adapt data for technician view
                setStats([
                    {
                        label: "Tareas Pendientes",
                        value: data.stats.pendingTasks || 0, // Ensure API returns this or mock it
                        icon: <CheckSquare className="w-5 h-5" />,
                        color: "text-blue-600"
                    },
                    {
                        label: "Casos Asignados",
                        value: data.stats.assignedCases || 0,
                        icon: <FileText className="w-5 h-5" />,
                        color: "text-teal-600"
                    },
                    {
                        label: "Alertas Activas",
                        value: data.stats.activeAlerts || 0,
                        icon: <AlertTriangle className="w-5 h-5" />,
                        color: "text-amber-600"
                    },
                    {
                        label: "Eficiencia",
                        value: `${data.stats.efficiency || 95}%`,
                        icon: <Zap className="w-5 h-5" />,
                        color: "text-emerald-600"
                    }
                ]);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            toast.error("Error cargando dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={`Hola, ${session?.user?.name?.split(' ')[0] || "Técnico"}`}
                subtitle="Aquí tienes tus tareas prioritarias para hoy."
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ContentCard className="lg:col-span-3" title="Mis Tareas">
                    <WorkflowTaskInbox />
                </ContentCard>
            </div>
        </PageContainer>
    );
}
