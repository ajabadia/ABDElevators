"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GeneralTab } from "@/components/admin/organizations/GeneralTab";
import { SecurityCenterCard } from "@/components/admin/organizations/SecurityCenterCard";
import { Building2, Save } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useToast } from "@/hooks/use-toast";
import { TenantConfig } from "@/lib/schemas";

/**
 * 🏢 General Settings Module
 * Basic organization configuration: ID, name, industry, compliance.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function OrganizationsGeneralPage() {
    const t = useTranslations("admin.organizations.page");
    const { toast } = useToast();
    const { config, setConfig, isSaving, setIsSaving } = useTenantConfigStore();

    const { data: tenants, refresh: refreshTenants } = useApiList<TenantConfig>({
        endpoint: '/api/admin/tenants',
        dataKey: 'tenants',
        onSuccess: (data) => {
            if (data.length > 0 && !config) {
                setConfig(data[0]);
            }
        }
    });

    const { mutate: saveConfig } = useApiMutation({
        endpoint: '/api/admin/tenants',
        successMessage: t('saveSuccess'),
        onSuccess: () => refreshTenants(),
        onError: (err) => {
            toast({
                title: t('error'),
                description: typeof err === 'string' ? err : t('saveError'),
                variant: 'destructive',
            });
        }
    });

    const handleSave = () => {
        if (config) {
            if (!config.tenantId) {
                toast({ title: t('error'), description: t('errorTenantId'), variant: 'destructive' });
                return;
            }
            setIsSaving(true);
            saveConfig(config);
        }
    };

    if (!config) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                icon={<Building2 className="w-6 h-6 text-primary" />}
                backHref="/admin/organizations"
                actions={
                    <Button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : <Save size={18} />}
                        {t('save')}
                    </Button>
                }
            />

            <div className="mt-6 space-y-6">
                <GeneralTab 
                    config={config} 
                    setConfig={(setter) => {
                        if (typeof setter === 'function') {
                            const newConfig = setter(config);
                            setConfig(newConfig);
                        } else {
                            setConfig(setter);
                        }
                    }} 
                />
                <SecurityCenterCard config={config} />
            </div>
        </PageContainer>
    );
}
