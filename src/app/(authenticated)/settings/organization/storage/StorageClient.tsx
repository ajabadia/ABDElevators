"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { StorageTab } from "@/components/admin/organizations/StorageTab";
import { Database } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/useApiMutation";

/**
 * StorageClient: Organization Storage Management
 * Pure content component refactored to remove internal PageContainer/Header.
 */
export default function StorageClient() {
    const { config, setConfig, isSaving, setIsSaving, usageStats, setUsageStats, isFetched, error } = useTenantConfigStore();

    const { mutate: saveConfig } = useApiMutation({
        endpoint: '/api/admin/tenants',
        onError: (err) => {
            toast.error("Error", {
                description: typeof err === 'string' ? err : "Error al guardar la configuración de almacenamiento",
            });
        },
        onSettled: () => setIsSaving(false)
    });

    useEffect(() => {
        let isMounted = true;
        if (config?.tenantId) {
            const fetchUsage = async () => {
                try {
                    const res = await fetch(`/api/admin/usage/stats?tenantId=${config.tenantId}`);
                    const data = await res.json();
                    if (data.success && isMounted) setUsageStats(data.stats);
                } catch (err) {
                    if (isMounted) console.error("Error fetching usage stats", err);
                }
            };
            fetchUsage();
        }
        return () => { isMounted = false; };
    }, [config?.tenantId, setUsageStats]);

    if (!isFetched) {
        return (
            <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-rose-50/20 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30 mt-6">
                <Database className="w-12 h-12 text-rose-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Error de Almacenamiento</h3>
                <p className="text-slate-500 max-w-sm mb-6 font-medium">{error || "No se ha podido cargar la configuración de almacenamiento."}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl font-bold">Reintentar</Button>
            </div>
        );
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (config) {
            setIsSaving(true);
            saveConfig(config);
        }
    };

    return (
        <form id="storage-form" onSubmit={handleSave} className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StorageTab
                config={config}
                setConfig={(setter) => {
                    if (typeof setter === 'function') {
                        const newConfig = setter(config);
                        setConfig(newConfig);
                    } else {
                        setConfig(setter);
                    }
                }}
                usageStats={usageStats}
            />
        </form>
    );
}
