"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BrandingTab } from "@/components/admin/organizations/BrandingTab";
import { Palette, Save } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useToast } from "@/hooks/use-toast";

/**
 * 🎨 Branding Module
 * Organization branding: logo, favicon, colors, reports preview.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function OrganizationsBrandingPage() {
    const t = useTranslations("admin.organizations.page");
    const { toast } = useToast();
    const { config, setConfig, isSaving, setIsSaving } = useTenantConfigStore();

    const { mutate: saveConfig } = useApiMutation({
        endpoint: '/api/admin/tenants',
        successMessage: t('saveSuccess'),
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
                icon={<Palette className="w-6 h-6 text-primary" />}
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

            <div className="mt-6">
                <BrandingTab 
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
            </div>
        </PageContainer>
    );
}
