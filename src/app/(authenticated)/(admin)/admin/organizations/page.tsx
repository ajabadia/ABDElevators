
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ui/content-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Save } from "lucide-react";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useToast } from "@/hooks/use-toast";

// Sub-components
import { GeneralTab } from "@/components/admin/organizations/GeneralTab";
import { BrandingTab } from "@/components/admin/organizations/BrandingTab";
import { StorageTab } from "@/components/admin/organizations/StorageTab";
import { FeaturesTab } from "@/components/admin/organizations/FeaturesTab";
import { BillingTab } from "@/components/admin/organizations/BillingTab";
import { SecurityCenterCard } from "@/components/admin/organizations/SecurityCenterCard";
import { ReportConfigTab } from "@/components/admin/organizations/ReportConfigTab";
import { TenantConfig } from "@/lib/schemas";

export default function OrganizationsPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [usageStats, setUsageStats] = useState<any>(null);
    const [isLoadingUsage, setIsLoadingUsage] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (config?.tenantId) {
            const fetchUsage = async () => {
                setIsLoadingUsage(true);
                try {
                    const res = await fetch(`/api/admin/usage/stats?tenantId=${config.tenantId}`);
                    const data = await res.json();
                    if (data.success) setUsageStats(data.stats);
                } catch (err) {
                    console.error("Error fetching usage stats", err);
                } finally {
                    setIsLoadingUsage(false);
                }
            };
            fetchUsage();
        }
    }, [config?.tenantId]);

    // 1. Carga de datos con useApiList
    const {
        data: tenants,
        isLoading,
        refresh: refreshTenants
    } = useApiList<TenantConfig>({
        endpoint: '/api/admin/tenants',
        dataKey: 'tenants',
        onSuccess: (data) => {
            if (data.length > 0 && !config) {
                // Seleccionar el primero por defecto o buscar por sesión si fuera necesario
                setConfig(data[0]);
            }
        }
    });

    // 2. Acción de guardado con useApiMutation
    const { mutate: saveConfig, isLoading: isSaving } = useApiMutation({
        endpoint: '/api/admin/tenants',
        successMessage: 'Configuración de la organización actualizada correctamente.',
        onSuccess: () => refreshTenants(),
        onError: (err) => {
            console.error("Save config error:", err);
            toast({
                title: 'Error al guardar',
                description: typeof err === 'string' ? err : 'No se pudo guardar la configuración.',
                variant: 'destructive',
            });
        }
    });

    const handleSave = () => {
        if (config) {
            if (!config.tenantId) {
                toast({ title: 'Error', description: 'Falta tenantId', variant: 'destructive' });
                return;
            }
            saveConfig(config);
        }
    };

    if (!isMounted || (isLoading && !config)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Configuración de Organización"
                highlight="Organización"
                subtitle="Gestiona el aislamiento de datos, identidad visual y cuotas de almacenamiento."
                actions={
                    <>
                        <Button variant="outline" onClick={() => refreshTenants()} disabled={isSaving}>Refrescar</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20"
                            disabled={isSaving}
                        >
                            {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : <Save size={18} />}
                            Guardar Cambios
                        </Button>
                    </>
                }
            />

            <ContentCard className="overflow-hidden" noPadding={true}>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-white dark:bg-slate-900 h-14 px-6 gap-8">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="branding"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Identidad y Branding
                        </TabsTrigger>
                        <TabsTrigger
                            value="storage"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Almacenamiento
                        </TabsTrigger>
                        <TabsTrigger
                            value="features"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Módulos
                        </TabsTrigger>
                        <TabsTrigger
                            value="billing"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            <CreditCard size={16} className="mr-2" /> Facturación
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Reportes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="p-8 space-y-8">
                        <GeneralTab config={config} setConfig={setConfig} />
                    </TabsContent>

                    <TabsContent value="branding" className="p-8 space-y-8">
                        <BrandingTab config={config} setConfig={setConfig} />
                    </TabsContent>

                    <TabsContent value="storage" className="p-8 space-y-8">
                        <StorageTab config={config} setConfig={setConfig} usageStats={usageStats} />
                    </TabsContent>

                    <TabsContent value="features" className="p-8">
                        <FeaturesTab config={config} />
                    </TabsContent>

                    <TabsContent value="billing" className="p-8 space-y-12">
                        <BillingTab config={config} setConfig={setConfig} usageStats={usageStats} />
                    </TabsContent>

                    <TabsContent value="reports" className="p-8 space-y-8">
                        <ReportConfigTab config={config} setConfig={setConfig} />
                    </TabsContent>
                </Tabs>
            </ContentCard>

            <SecurityCenterCard config={config} />
        </PageContainer >
    );
}
