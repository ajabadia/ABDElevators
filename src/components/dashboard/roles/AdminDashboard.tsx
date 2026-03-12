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
import { Activity, CreditCard, LayoutDashboard, ShieldCheck, Building, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import { MicroSurvey } from "@/components/shared/MicroSurvey";
import { useCallback } from "react";
import { useEphemeralStore } from "@/store/ephemeral-store";

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

    const { data: usageStats } = useApiItem<any>({
        endpoint: '/api/admin/usage/stats',
        dataKey: 'stats'
    });

    const { data: tenantHealth } = useApiItem<any>({
        endpoint: '/api/admin/tenant-health',
        dataKey: 'health'
    });

    const router = useRouter();

    // Show the micro-survey once per session, after 30 seconds on the Admin Console.
    const { isDismissed, dismissItem } = useEphemeralStore();
    const [surveyVisible, setSurveyVisible] = useState(false);
    
    useEffect(() => {
        const key = 'abd_survey_admin_console_shown';
        if (isDismissed(key)) return;
        
        const timer = setTimeout(() => {
            setSurveyVisible(true);
            dismissItem(key); // Mark as shown/dismissed immediately or on actual dismiss
        }, 30_000);
        return () => clearTimeout(timer);
    }, [isDismissed, dismissItem]);

    const handleSurveyDismiss = useCallback(() => setSurveyVisible(false), []);

    const billing = { planName: usageStats?.tier || 'FREE', statusLabel: 'Activo' };
    const storageLimitBytes = usageStats?.limits?.storage || Infinity;
    const storageUsedBytes = usageStats?.storage || 0;
    const storageUsagePercent = storageLimitBytes === Infinity ? 0 : (storageUsedBytes / storageLimitBytes) * 100;

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const storageUsedHuman = formatBytes(storageUsedBytes);
    const storageLimitHuman = storageLimitBytes === Infinity ? 'Ilimitado' : formatBytes(storageLimitBytes);

    const healthStatus = tenantHealth?.status || 'HEALTHY';
    let healthBadgeLabel = "Estable";
    let healthTag = "OK";
    let healthVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "success" as any; // Using type casting for custom variants if they exist, fallback to default UI variants

    if (healthStatus === 'WARNING') {
        healthBadgeLabel = "Degradado";
        healthTag = "ATENCIÓN";
        healthVariant = "warning" as any;
    } else if (healthStatus === 'CRITICAL') {
        healthBadgeLabel = "Error Crítico";
        healthTag = "CRÍTICO";
        healthVariant = "destructive";
    }

    const ingestSuccessRate = tenantHealth?.ingestSuccessRate || 0;

    return (
        <PageContainer>
            <PageHeader
                title={`Admin Console: ${session?.user?.name?.split(' ')[0] || "Admin"}`}
                subtitle="Vista unificada de administración, facturación y auditoría."
            />

            <ContextualHelp
                description="Aquí ves la salud general del tenant. Si algún indicador está en ámbar o rojo, pulsa 'Info' para investigar en la consola de Operaciones."
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

                <div className="mb-6 grid gap-4 md:grid-cols-[2fr,1fr]">
                    {/* Organización & Plan */}
                    <div className="p-4 md:p-5 rounded-2xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Building className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">
                                        Organización
                                    </p>
                                    <p className="text-lg font-bold leading-tight">
                                        {(session?.user as any)?.tenantName ?? "Tenant actual"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Industria: <span className="font-medium">{(dashboardData as any)?.tenantConfig?.industry ?? "Genérico"}</span>
                            </p>
                        </div>

                        <div className="border-l h-12 mx-4 hidden md:block" />

                        <div className="space-y-2 md:text-right relative z-10 w-full md:w-auto">
                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">
                                Plan & Uso
                            </p>
                            <p className="text-sm font-bold pt-1">
                                {billing.planName} ·{" "}
                                <span className="font-normal text-muted-foreground">
                                    {billing.statusLabel}
                                </span>
                            </p>
                            <div className="flex items-center gap-2 md:justify-end">
                                <div className="w-full md:w-32 h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(storageUsagePercent, 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                    {storageUsedHuman} / {storageLimitHuman}
                                </span>
                            </div>
                            <button
                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                onClick={() => document.querySelector('[value="billing"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                            >
                                Gestionar plan
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Tarjeta pequeña de estado rápido */}
                    <div className="p-4 md:p-5 rounded-2xl border bg-card flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">
                                        Salud del Tenant
                                    </p>
                                    <p className="text-sm font-bold tracking-tight">
                                        {healthBadgeLabel}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant={healthVariant as any}
                                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold"
                            >
                                {healthTag}
                            </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                            <span>
                                Ingesta 24h:{" "}
                                <span className={`font-bold ml-1 ${ingestSuccessRate >= 99 ? 'text-emerald-600 dark:text-emerald-400' : ingestSuccessRate >= 90 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {ingestSuccessRate.toFixed(1)}%
                                </span>
                            </span>
                            <button
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                onClick={() => router.push("/admin/operations")}
                            >
                                Info
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* System Health Stats */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-600" />
                            Métricas de Salud
                        </h3>
                        <ContextualHelp
                            className="bg-teal-50/50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-900"
                            description="Estas métricas indican si la IA está respondiendo correctamente (Calidad RAG), SLAs operativos y consumo. No hace falta entender cada cifra; busca descensos bruscos o anomalías."
                        />
                        <AuditMetrics
                            stats={auditStats || {
                                totalCases: dashboardData?.stats?.totalDocuments || 0,
                                performance: {
                                    sla_violations_30d: 0,
                                    rag_avg_accuracy: dashboardData?.stats?.accuracyRate || 94,
                                    uptime: 99.98,
                                },
                                usage: {
                                    tokens: dashboardData?.stats?.totalQueries * 150 || 0
                                }
                            }}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Recent Config/Security Activity */}
                    <div>
                        <h3 className="text-lg font-bold mb-1">Actividad reciente de configuración y seguridad</h3>
                        <ContextualHelp
                            description="Aquí aparecen cambios de configuración, creación de usuarios o accesos denegados. Útil para entender por qué las cosas han 'empezado a ir mal' repentinamente, verificando quién modificó qué cosa."
                        />
                        <DashboardRecentActivity
                            activities={dashboardData?.activities || []}
                            t={(key: string) => key} // Mock translation function if needed, or pass useTranslations result
                        />
                    </div>

                    {/* Micro-Survey: fires 30s after first visit to Admin Console */}
                    {surveyVisible && (
                        <MicroSurvey
                            context="admin_console"
                            onDismiss={handleSurveyDismiss}
                            className="max-w-sm mt-4"
                        />
                    )}
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
