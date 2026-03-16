"use client";

import { useState } from 'react';
import { useEnvironmentStore } from '@/store/environment-store';
import { useFilterState } from '@/hooks/useFilterState';
import { useApiExport } from '@/hooks/useApiExport';
import { useApiList } from '@/hooks/useApiList';
import { Chunk } from '@/components/admin/knowledge/explorer/types';

/**
 * useKnowledgeExplorer — ERA 14 Refactor
 * Centralizes state management, filtering, and data fetching for the Knowledge Explorer.
 */
export function useKnowledgeExplorer() {
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
        refresh,
        rawResponse
    } = useApiList<Chunk>({
        endpoint: '/api/admin/knowledge-base/chunks',
        dataKey: 'chunks',
        debounceMs: 500,
        filters: {
            ...filters,
            environment,
            q: simulationMode ? simulatorSearch : filters.query,
            mode: simulationMode ? 'semantic' : 'regex',
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

    return {
        // State
        filters,
        page,
        total,
        chunks,
        isLoading,
        isExporting,
        simulationMode,
        simulatorSearch,
        isAdvancedFiltersOpen,
        metadata: rawResponse?.metadata,
        
        // Setters
        setFilter,
        setPage,
        setSimulationMode,
        setSimulatorSearch,
        setIsAdvancedFiltersOpen,
        
        // Actions
        refresh,
        handleExport
    };
}
