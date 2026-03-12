"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";
import { KnowledgeAsset } from "@/types/knowledge";
import { useKnowledgeAssets } from "@/hooks/useKnowledgeAssets";

// Modular Components
import { AssetMetrics } from "./assets/AssetMetrics";
import { AssetControls } from "./assets/AssetControls";
import { AssetTable } from "./assets/AssetTable";
import { AssetModals } from "./assets/AssetModals";

interface KnowledgeAssetsManagerProps {
    scope?: 'all' | 'user';
    userId?: string;
    spacePath?: string;
    onSelect?: (asset: KnowledgeAsset | null) => void;
    selectedAssetId?: string;
}

/**
 * KnowledgeAssetsManager — ERA 14 Refactor
 * Orchestrates the asset listing, metrics, filtering, and management modals.
 * Uses useKnowledgeAssets hook for logic.
 */
export function KnowledgeAssetsManager({ 
    scope = 'all', 
    userId, 
    spacePath, 
    onSelect, 
    selectedAssetId 
}: KnowledgeAssetsManagerProps) {

    const tCommon = useTranslations('common');
    
    const {
        // Data
        documents,
        total,
        isLoading,
        stats,
        
        // UI State
        searchTerm,
        statusFilter,
        reviewFilter,
        modalState,
        reviewDate,
        page,
        totalPages,
        
        // Setters
        setSearchTerm,
        setStatusFilter,
        setReviewFilter,
        setModalState,
        setReviewDate,
        setPage,
        
        // Actions
        refresh,
        handleStatusChange,
        handleDelete,
        handleReviewSubmit
    } = useKnowledgeAssets({ scope, userId, spacePath });

    return (
        <div className="space-y-6">
            <AssetModals
                modalState={modalState}
                onClose={() => setModalState({ type: 'closed' })}
                refresh={refresh}
                reviewDate={reviewDate}
                onReviewDateChange={setReviewDate}
                onReviewSubmit={handleReviewSubmit}
            />

            <AssetMetrics stats={stats} />

            <ContentCard>
                <AssetControls
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    reviewFilter={reviewFilter}
                    onReviewFilterChange={setReviewFilter}
                    onNewAsset={() => setModalState({ type: 'upload' })}
                />

                <AssetTable
                    documents={documents}
                    isLoading={isLoading}
                    onSelect={onSelect}
                    selectedAssetId={selectedAssetId}
                    onNewAsset={() => setModalState({ type: 'upload' })}
                    handleStatusChange={handleStatusChange}
                    handleDelete={handleDelete}
                    setModalState={setModalState}
                    refresh={refresh}
                />

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 border-t border-border pt-6">
                        <p className="text-xs text-muted-foreground">
                            {tCommon('pagination.total_items', { total: total || 0 })}
                        </p>
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                {tCommon('pagination.page_info', { current: page, total: totalPages })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                    aria-label={tCommon('pagination.previous_page') || 'Previous Page'}
                                >
                                    <ChevronLeft size={14} aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isLoading}
                                    aria-label={tCommon('pagination.next_page') || 'Next Page'}
                                >
                                    <ChevronRight size={14} aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </ContentCard>
        </div>
    );
}
