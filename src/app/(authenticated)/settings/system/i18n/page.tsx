'use client';

import React, { useState, useEffect } from 'react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { TranslationTable } from '@/components/admin/TranslationTable';
import { CreateI18nKeyModal } from '@/components/admin/CreateI18nKeyModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * AdminI18nPage: Master Translation Management (Phase 62)
 * Allows editing, comparing, and IA-translating all system messages.
 */
export default function AdminI18nPage() {
    const t = useTranslations('admin_knowledge');
    const [searchQuery, setSearchQuery] = useState('');
    const [primaryLocale, setPrimaryLocale] = useState('es');
    const [secondaryLocale, setSecondaryLocale] = useState('en');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [namespaceFilter, setNamespaceFilter] = useState('');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    // Pagination state
    const [pageSize, setPageSize] = useState(50);
    const [offset, setOffset] = useState(0);

    // Debouncing to avoid fetch bursts
    const debouncedSearch = useDebounce(searchQuery, 600);
    const debouncedNamespace = useDebounce(namespaceFilter, 300);

    // Reset page when filters change
    useEffect(() => {
        setOffset(0);
    }, [debouncedSearch, debouncedNamespace, showMissingOnly, primaryLocale]);

    // Determine if active filters exist (for UI)
    const hasActiveFilters = Boolean(namespaceFilter || searchQuery || showMissingOnly);

    // Load namespace stats
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

    // 1. Load primary locale messages (with filters and pagination)
    const actualNamespace = debouncedNamespace === '__ALL__' ? '' : debouncedNamespace;

    const {
        data: dataPrimary,
        isLoading: loadingPrimary,
        refresh: refetchPrimary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${primaryLocale}&namespace=${actualNamespace}&search=${debouncedSearch}&limit=${pageSize}&offset=${offset}&detailed=true&missingOnly=${showMissingOnly}&secondaryLocale=${secondaryLocale}`,
        autoFetch: true
    });

    // 2. Load secondary locale messages (Comparison)
    const {
        data: dataSecondary,
        isLoading: loadingSecondary,
        refresh: refetchSecondary
    } = useApiItem<any>({
        endpoint: `/api/admin/i18n?locale=${secondaryLocale}&namespace=${actualNamespace}&search=${debouncedSearch}&limit=${pageSize}&offset=${offset}&detailed=true`,
        autoFetch: true
    });

    const messagesPrimary = dataPrimary?.messages || {};
    const messagesSecondary = dataSecondary?.messages || {};
    const pagination = dataPrimary?.pagination;

    const syncMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: (data: any) => {
            refetchPrimary();
            refetchSecondary();

            const added = data?.result?.added || 0;
            const updated = data?.result?.updated || 0;
            const total = added + updated;

            if (total === 0) {
                toast.info(t('table.notifications.syncCompletedTitle'), {
                    description: t('table.notifications.syncNoChanges')
                });
            } else {
                toast.success(t('table.notifications.syncSuccessTitle'), {
                    description: `${t('table.notifications.syncSuccessDetail', { added, updated })}`
                });
            }
        },
        onError: (err) => {
            toast.error(t('table.notifications.syncErrorTitle'), {
                description: typeof err === 'string' ? err : t('table.notifications.syncErrorDesc') || 'Sync error'
            });
        }
    });

    const syncAllMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: (data: any) => {
            refetchPrimary();
            refetchSecondary();

            const results = data.result || {};
            let totalAdded = 0;
            let totalUpdated = 0;
            Object.values(results).forEach((r: any) => {
                totalAdded += (r.added || 0);
                totalUpdated += (r.updated || 0);
            });

            toast.success('Global Sync Completed', {
                description: `All locales processed. added: ${totalAdded}, updated: ${totalUpdated}`
            });
        },
        onError: (err) => {
            toast.error('Global Error', {
                description: typeof err === 'string' ? err : 'Global sync failed'
            });
        }
    });

    const exportMutation = useApiMutation({
        endpoint: '/api/admin/i18n/sync',
        method: 'POST',
        onSuccess: (data: any) => {
            toast.success(t('page.exportSuccessTitle') || 'Export Successful', {
                description: data.message || t('page.exportSuccessDesc')
            });
        },
        onError: (err) => {
            toast.error(t('page.exportErrorTitle') || 'Error', {
                description: typeof err === 'string' ? err : 'Export failed'
            });
        }
    });

    const safeMessagesPrimary = messagesPrimary || {};
    const safeMessagesSecondary = messagesSecondary || {};

    return (
        <PageContainer>
            <PageHeader
                title={t('page.title')}
                highlight={t('page.highlight')}
                subtitle={t('page.subtitle')}
                backHref="/settings/system"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 dark:border-slate-800"
                            onClick={() => syncMutation.mutate({ locale: primaryLocale })}
                            disabled={syncMutation.isLoading || syncAllMutation.isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.syncBtn') || 'JSON→DB'}
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl border-teal-500/50 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                            onClick={() => syncAllMutation.mutate({ locale: 'all' })}
                            disabled={syncMutation.isLoading || syncAllMutation.isLoading}
                        >
                            <Globe className={`w-4 h-4 mr-2 ${syncAllMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.syncAllBtn') || 'Sync All'}
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                            onClick={() => exportMutation.mutate({ locale: primaryLocale, action: 'export' })}
                            disabled={exportMutation.isLoading}
                        >
                            <FileJson className={`w-4 h-4 mr-2 ${exportMutation.isLoading ? 'animate-spin' : ''}`} />
                            {t('page.exportBtn') || 'Export to JSON (DB→JSON)'}
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
                <ContentCard className="bg-white dark:bg-slate-950 border-slate-200/60 shadow-xl shadow-slate-200/10">
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={t('page.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-teal-500/50 w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setNamespaceFilter('__ALL__')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${namespaceFilter === '__ALL__'
                                    ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                                    }`}
                            >
                                ALL ({totalCount})
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

                <TranslationTable
                    primaryLocale={primaryLocale}
                    secondaryLocale={secondaryLocale}
                    primaryMessages={messagesPrimary}
                    secondaryMessages={messagesSecondary}
                    searchQuery={searchQuery}
                    showMissingOnly={showMissingOnly}
                    loading={loadingPrimary || loadingSecondary}
                    hasActiveFilters={true}
                    pagination={pagination}
                    onPageChange={(newOffset) => setOffset(newOffset)}
                    onLimitChange={(newLimit) => {
                        setPageSize(newLimit);
                        setOffset(0);
                    }}
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
