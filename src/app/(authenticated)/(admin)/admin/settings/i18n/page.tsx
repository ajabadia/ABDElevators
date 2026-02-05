'use client';

import React, { useState } from 'react';
import {
    Languages,
    Search,
    Save,
    Sparkles,
    RefreshCw,
    Globe,
    CheckCircle2,
    AlertCircle,
    FileJson,
    ArrowRightLeft
} from 'lucide-react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';
import { TranslationTable } from '../../../../../../components/admin/TranslationTable';
import { CreateI18nKeyModal } from '@/components/admin/CreateI18nKeyModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from 'next-intl';

/**
 * AdminI18nPage: Gestión Maestra de Traducciones (Fase 62)
 * Permite editar, comparar y traducir con IA todos los mensajes del sistema.
 */
export default function AdminI18nPage() {
    const t = useTranslations('admin.i18n');
    const [searchQuery, setSearchQuery] = useState('');
    const [primaryLocale, setPrimaryLocale] = useState('es');
    const [secondaryLocale, setSecondaryLocale] = useState('en');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // 1. Cargar mensajes del idioma primario
    const {
        data: messagesPrimary,
        isLoading: loadingPrimary,
        refresh: refetchPrimary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${primaryLocale}`,
        dataKey: 'messages',
        autoFetch: true
    });

    // 2. Cargar mensajes del idioma secundario (Comparación)
    const {
        data: messagesSecondary,
        isLoading: loadingSecondary,
        refresh: refetchSecondary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${secondaryLocale}`,
        dataKey: 'messages',
        autoFetch: true
    });

    const syncMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: () => {
            refetchPrimary();
            refetchSecondary();
        }
    });


    // Simplificamos acceso ya que dataKey: 'messages' nos da el objeto directamente
    const safeMessagesPrimary = messagesPrimary || {};
    const safeMessagesSecondary = messagesSecondary || {};

    return (
        <PageContainer>
            <PageHeader
                title={t('page.title')}
                highlight={t('page.highlight')}
                subtitle={t('page.subtitle')}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 dark:border-slate-800"
                            onClick={() => syncMutation.mutate({ locale: primaryLocale })}
                            disabled={syncMutation.isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.syncBtn')}
                        </Button>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold"
                        >
                            <Languages className="w-4 h-4 mr-2" />
                            {t('page.newKeyBtn')}
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                {/* Panel de Control y Filtros */}
                <ContentCard className="bg-white dark:bg-slate-950 border-slate-200/60 shadow-xl shadow-slate-200/10">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={t('page.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-teal-500/50"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <select
                                value={primaryLocale}
                                onChange={(e) => setPrimaryLocale(e.target.value)}
                                className="bg-white dark:bg-slate-950 px-4 py-2 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-slate-200 dark:ring-slate-800"
                            >
                                <option value="es">{t('languages.es')}</option>
                                <option value="en">{t('languages.en')}</option>
                            </select>

                            <ArrowRightLeft className="w-4 h-4 text-slate-400 mx-1" />

                            <select
                                value={secondaryLocale}
                                onChange={(e) => setSecondaryLocale(e.target.value)}
                                className="bg-white dark:bg-slate-950 px-4 py-2 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-slate-200 dark:ring-slate-800"
                            >
                                <option value="en">{t('languages.en')}</option>
                                <option value="es">{t('languages.es')}</option>
                            </select>
                        </div>
                    </div>
                </ContentCard>

                {/* Tabla de Traducciones */}
                <TranslationTable
                    primaryLocale={primaryLocale}
                    secondaryLocale={secondaryLocale}
                    primaryMessages={safeMessagesPrimary}
                    secondaryMessages={safeMessagesSecondary}
                    searchQuery={searchQuery}
                    loading={loadingPrimary || loadingSecondary}
                    onRefresh={() => {
                        refetchPrimary();
                        refetchSecondary();
                    }}
                />
            </div>

            <CreateI18nKeyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    refetchPrimary();
                    refetchSecondary();
                }}
                locale={primaryLocale}
            />
        </PageContainer>
    );
}
