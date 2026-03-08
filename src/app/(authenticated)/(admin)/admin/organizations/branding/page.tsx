"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BrandingTab } from "@/components/admin/organizations/BrandingTab";
import { Palette, Save } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { useApiMutation } from "@/hooks/useApiMutation";
import { toast } from "sonner";

/**
 * 🎨 Branding Module
 * Organization branding: logo, favicon, colors, reports preview.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function OrganizationsBrandingPage() {
    const t = useTranslations("admin.organizations.page");

    const { config, setConfig, isSaving, setIsSaving, isFetched, error } = useTenantConfigStore();

    const { mutate: saveConfig } = useApiMutation({
        endpoint: '/api/admin/tenants',
        successMessage: t('saveSuccess'),
        onError: (err) => {
            toast.error(t('error'), {
                description: typeof err === 'string' ? err : t('saveError'),
            });
        },
        onSettled: () => setIsSaving(false)
    });

    const handleSave = () => {
        if (config) {
            setIsSaving(true);
            saveConfig(config);
        }
    };

    if (!isFetched) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-rose-50/20 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                <Palette className="w-12 h-12 text-rose-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Error de Branding</h3>
                <p className="text-slate-500 max-w-sm mb-6">{error || "No se ha podido cargar la configuración visual."}</p>
                <Button onClick={() => window.location.reload()} variant="outline">Reintentar</Button>
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
