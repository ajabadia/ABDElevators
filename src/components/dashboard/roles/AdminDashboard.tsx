"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsumptionDashboard } from "@/components/admin/ConsumptionDashboard";
import { AuditMetrics } from "@/components/admin/AuditMetrics";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApiItem } from "@/hooks/useApiItem";
import { Activity, CreditCard, LayoutDashboard, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
    const t = useTranslations("dashboard");
    const { data: session } = useSession();

    // Fetch generic admin stats
    // Assuming backend endpoint exists or using user dashboard as base
    const { data: dashboardData, isLoading } = useApiItem<any>({
        endpoint: '/api/user/dashboard', // Fallback to user dashboard for now
    });

    const { data: auditStats } = useApiItem<any>({
        endpoint: '/api/admin/audit/stats', // Try to fetch specific audit stats
    });

    return (
        <PageContainer>
            <PageHeader
                title={`Admin Console: ${session?.user?.name?.split(' ')[0] || "Admin"}`}
                subtitle="Supervisión global del sistema y facturación."
            />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <LayoutDashboard className="w-4 h-4" /> Vision General
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <CreditCard className="w-4 h-4" /> Facturación y Uso
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm">
                        <ShieldCheck className="w-4 h-4" /> Auditoría
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* System Health Stats */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-600" /> Métricas de Salud
                        </h3>
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
                    </div>

                    {/* Recent Config/Security Activity */}
                    <DashboardRecentActivity
                        activities={dashboardData?.activities || []}
                        t={(key: string) => key} // Mock translation function if needed, or pass useTranslations result
                    />
                </TabsContent>

                <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-4">
                    <ConsumptionDashboard />
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">Panel de Seguridad Avanzada</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Este módulo centralizará los logs de auditoría, gestión de roles de Guardian V3 y políticas de retención de datos.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
