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
import { toast } from 'sonner';

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
    const [namespaceFilter, setNamespaceFilter] = useState('');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    // Determinar si hay filtros activos (para lazy loading)
    // '__ALL__' es un valor especial que significa "cargar todos"
    const hasActiveFilters = Boolean(namespaceFilter || searchQuery || showMissingOnly);

    // Cargar estadísticas de namespaces
    const {
        data: stats,
        isLoading: loadingStats
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n/stats?locale=${primaryLocale}`,
        autoFetch: true
    });

    const totalCount = stats?.total || 0;
    const namespaceCounts = stats?.namespaces || {};
    const namespaces = Object.keys(namespaceCounts).sort();

    // 1. Cargar mensajes del idioma primario (con filtros)
    // Si namespaceFilter es '__ALL__', enviar all=true para cargar todos
    const actualNamespace = namespaceFilter === '__ALL__' ? '' : namespaceFilter;
    const allParam = namespaceFilter === '__ALL__' ? '&all=true' : '';

    const {
        data: messagesPrimary,
        isLoading: loadingPrimary,
        refresh: refetchPrimary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${primaryLocale}&namespace=${actualNamespace}&search=${searchQuery}${allParam}`,
        dataKey: 'messages',
        autoFetch: hasActiveFilters // Solo cargar si hay filtros activos
    });

    // 2. Cargar mensajes del idioma secundario (Comparación)
    const {
        data: messagesSecondary,
        isLoading: loadingSecondary,
        refresh: refetchSecondary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${secondaryLocale}&namespace=${actualNamespace}&search=${searchQuery}${allParam}`,
        dataKey: 'messages',
        autoFetch: hasActiveFilters // Solo cargar si hay filtros activos
    });

    const syncToDbMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: (data: any) => {
            console.log('[i18n-sync] ✅ syncToDb success:', data);
            refetchPrimary();
            refetchSecondary();

            // Show detailed toast (Smart-Merge aware)
            const added = data?.added || 0;
            const updated = data?.updated || 0;
            const total = added + updated;
            const keys = data?.keysAdded || [];

            if (total === 0) {
                toast.info('Sincronización completada', {
                    description: 'No se detectaron discrepancias entre JSON y BD.'
                });
            } else {
                const sampleKeys = Array.isArray(keys) ? keys.slice(0, 5).join(' | ') : '';
                const remaining = (Array.isArray(keys) && keys.length > 5) ? ` (+${keys.length - 5} más)` : '';
                toast.success(`Sincronización exitosa`, {
                    description: `${added} nuevas, ${updated} actualizadas. [${sampleKeys}${remaining}]`
                });
            }
        },
        onError: (err) => {
            console.error('[i18n-sync] ❌ syncToDb error:', err);
            toast.error('Error de sincronización', {
                description: typeof err === 'string' ? err : 'Error al sincronizar con la base de datos'
            });
        }
    });

    const syncToFileMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: (data: any) => {
            console.log('[i18n-sync] ✅ syncToFile success:', data);
            refetchPrimary();
            refetchSecondary();

            // Show detailed toast (Smart-Merge aware)
            const added = data?.added || 0;
            const updated = data?.updated || 0;
            const total = added + updated;
            const keys = data?.keysAdded || [];

            if (total === 0) {
                toast.info('Exportación completada', {
                    description: 'Los archivos JSON ya están sincronizados con la BD.'
                });
            } else {
                const sampleKeys = Array.isArray(keys) ? keys.slice(0, 5).join(' | ') : '';
                const remaining = (Array.isArray(keys) && keys.length > 5) ? ` (+${keys.length - 5} más)` : '';
                toast.success(`Exportación exitosa`, {
                    description: `${added} nuevas, ${updated} actualizadas en JSON. [${sampleKeys}${remaining}]`
                });
            }
        },
        onError: (err) => {
            console.error('[i18n-sync] ❌ syncToFile error:', err);
            toast.error('Error de exportación', {
                description: typeof err === 'string' ? err : 'Error al exportar a archivos locales'
            });
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
                            onClick={() => syncToDbMutation.mutate({ locale: primaryLocale, direction: 'to-db' })}
                            disabled={syncToDbMutation.isLoading}
                            title="Sincronizar desde archivos JSON hacia la Base de Datos"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncToDbMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.syncToDbBtn') || 'JSON→BD'}
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                            onClick={() => syncToFileMutation.mutate({ locale: primaryLocale, direction: 'to-file' })}
                            disabled={syncToFileMutation.isLoading}
                            title="Exportar desde la Base de Datos hacia archivos JSON"
                        >
                            <FileJson className={`w-4 h-4 mr-2 ${syncToFileMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.syncToFileBtn') || 'BD→JSON'}
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
                    <div className="flex flex-col gap-4">
                        {/* Search Bar - Full Width Row */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={t('page.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-teal-500/50 w-full"
                            />
                        </div>

                        {/* Namespace Filters - Separate Row */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setNamespaceFilter('__ALL__')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${namespaceFilter === '__ALL__'
                                    ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                                    }`}
                            >
                                TODOS ({totalCount})
                            </button>
                            {namespaces.map(ns => (
                                <button
                                    key={ns}
                                    onClick={() => setNamespaceFilter(ns)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${namespaceFilter === ns
                                        ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                                        }`}
                                >
                                    {ns.toUpperCase()}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${namespaceFilter === ns ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        }`}>
                                        {namespaceCounts[ns] || 0}
                                    </span>
                                </button>
                            ))}

                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 self-center hidden md:block" />

                            <button
                                onClick={() => setShowMissingOnly(!showMissingOnly)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${showMissingOnly
                                    ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-600 hover:border-amber-500/50"
                                    }`}
                            >
                                <AlertCircle className="w-3 h-3" />
                                {t('page.filterMissing')}
                            </button>
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
                    showMissingOnly={showMissingOnly}
                    loading={loadingPrimary || loadingSecondary}
                    hasActiveFilters={hasActiveFilters}
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
