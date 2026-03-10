"use client";

import React, { useState } from 'react';
import { Database, RefreshCcw, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { GuardianGuard } from '@/components/shared/GuardianGuard';
import { useApiList } from '@/hooks/useApiList';
import { useFilterState } from '@/hooks/useFilterState';
import { useApiExport } from '@/hooks/useApiExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgenticSupportSearch } from '@/components/technical/AgenticSupportSearch';
import { useEnvironmentStore } from '@/store/environment-store';

// Modular Components
import { ExplorerMetrics } from './explorer/ExplorerMetrics';
import { ExplorerControls } from './explorer/ExplorerControls';
import { ExplorerResults } from './explorer/ExplorerResults';
import { Chunk } from './explorer/types';

/**
 * 🧠 Knowledge Explorer (Refactored Phase 345)
 * Modular architecture applying SRP.
 */
export const KnowledgeExplorer: React.FC = () => {
    const t = useTranslations('admin_knowledge');
    const { environment } = useEnvironmentStore();

    // 1. Filter & Pagination State
    const {
        filters,
        setFilter,
        page,
        setPage
    } = useFilterState({
        initialFilters: {
            query: "",
            searchType: 'regex',
            language: 'all',
            type: 'all',
            spacePath: undefined as string | undefined,
            limit: 20
        }
    });

    const [simulationMode, setSimulationMode] = useState(false);
    const [simulatorSearch, setSimulatorSearch] = useState("");
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

    // 2. Data Export
    const { exportData, isExporting } = useApiExport({
        endpoint: '/api/admin/knowledge-base/export',
        filename: 'knowledge-base-chunks'
    });

    // 3. Data Fetching
    const {
        data: chunks,
        isLoading,
        total,
        refresh
    } = useApiList<Chunk>({
        endpoint: '/api/admin/knowledge-base/chunks',
        dataKey: 'chunks',
        debounceMs: 500,
        filters: {
            ...filters,
            environment,
            query: simulationMode ? simulatorSearch : filters.query,
            searchType: simulationMode ? 'semantic' : 'regex',
            language: filters.language === 'all' ? undefined : filters.language,
            type: filters.type === 'all' ? undefined : filters.type,
            spacePath: filters.spacePath,
            skip: ((page - 1) * filters.limit).toString(),
            limit: filters.limit.toString()
        }
    });

    const handleExport = () => {
        exportData({
            ...filters,
            query: filters.query,
            total_records: total
        });
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="explorer" className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="transition-colors duration-300">
                        <h2 className="text-3xl font-black text-foreground font-outfit tracking-tight">{t('explorer_h2')}</h2>
                        <p className="text-muted-foreground font-medium">{t('explorer_subtitle')}</p>
                    </div>

                    <TabsList className="bg-muted p-1 rounded-xl h-12">
                        <TabsTrigger value="explorer" className="gap-2 rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
                            <LayoutPanelLeft size={14} /> {t('tabs.explorer')}
                        </TabsTrigger>
                        <TabsTrigger value="ai-query" className="gap-2 rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
                            <Sparkles size={14} className="text-blue-500" /> {t('tabs.ai')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="explorer" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <div className="flex gap-2">
                            <GuardianGuard resource="knowledge-asset" action="export">
                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    size="sm"
                                    className="text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-xl"
                                    disabled={isExporting || isLoading}
                                    aria-label={t('actions.export')}
                                >
                                    {isExporting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                    {t('actions.export')}
                                </Button>
                            </GuardianGuard>
                            <Button
                                onClick={() => refresh()}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-border"
                                aria-label={t('actions.refresh')}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" /> {t('actions.refresh')}
                            </Button>
                        </div>
                    </div>

                    {/* 📊 Metrics Section */}
                    <ExplorerMetrics total={total || 0} />

                    {/* 🔍 Search and Filters Section */}
                    <ExplorerControls
                        query={filters.query}
                        onQueryChange={(val) => setFilter('query', val)}
                        simulationMode={simulationMode}
                        onSimulationModeChange={setSimulationMode}
                        simulatorSearch={simulatorSearch}
                        onSimulatorSearchChange={setSimulatorSearch}
                        isAdvancedOpen={isAdvancedFiltersOpen}
                        onToggleAdvanced={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                        filters={{
                            language: filters.language,
                            type: filters.type
                        }}
                        onFilterChange={(key, val) => setFilter(key as any, val)}
                        onSearch={refresh}
                    />

                    {/* 📄 Results Section */}
                    <ExplorerResults
                        chunks={chunks}
                        isLoading={isLoading}
                        total={total || 0}
                        page={page}
                        onPageChange={setPage}
                        limit={filters.limit}
                    />
                </TabsContent>

                <TabsContent value="ai-query" className="animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                    <AgenticSupportSearch />
                </TabsContent>
            </Tabs>
        </div>
    );
};
