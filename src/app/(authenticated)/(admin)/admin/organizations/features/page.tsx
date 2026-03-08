"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FeaturesTab } from "@/components/admin/organizations/FeaturesTab";
import { Puzzle } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";

/**
 * 🧩 Features Module
 * Available modules and features: RAG Search, Gemini Analysis, etc.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function OrganizationsFeaturesPage() {
    const t = useTranslations("admin.organizations.page");
    const { config, isFetched, error } = useTenantConfigStore();

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
                <Puzzle className="w-12 h-12 text-rose-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Error de Funcionalidades</h3>
                <p className="text-slate-500 max-w-sm mb-6">{error || "No se ha podido cargar la configuración de módulos."}</p>
                <Button onClick={() => window.location.reload()} variant="outline">Reintentar</Button>
            </div>
        );
    }

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                icon={<Puzzle className="w-6 h-6 text-primary" />}
                backHref="/admin/organizations"
            />

            <div className="mt-6">
                <FeaturesTab config={config} />
            </div>
        </PageContainer>
    );
}
