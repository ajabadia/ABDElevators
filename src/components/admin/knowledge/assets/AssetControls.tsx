"use client";

import React from 'react';
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface AssetControlsProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusFilterChange: (val: string) => void;
    reviewFilter: string;
    onReviewFilterChange: (val: string) => void;
    onNewAsset: () => void;
}

/**
 * AssetControls — ERA 14 Refactor
 * Handles search, filtering, and the action to add new assets.
 */
export function AssetControls({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    reviewFilter,
    onReviewFilterChange,
    onNewAsset
}: AssetControlsProps) {
    const t = useTranslations('knowledge_assets');
    const tCommon = useTranslations('common');

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-between">
            <div className="flex flex-1 items-center gap-3 max-w-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" size={18} />
                    <Input
                        type="search"
                        role="searchbox"
                        aria-label={t('search_placeholder')}
                        placeholder={t('search_placeholder')}
                        className="pl-10 border-border focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="all">{tCommon('filters.all_status') || 'Todos los Estados'}</option>
                    <option value="vigente">{t('status.active')}</option>
                    <option value="obsoleto">{t('status.obsolete')}</option>
                    <option value="archivado">{t('status.archived')}</option>
                </select>
                <select
                    value={reviewFilter}
                    onChange={(e) => onReviewFilterChange(e.target.value)}
                    className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="all">{t('review.filter_all') || 'Revisiones: Todas'}</option>
                    <option value="pending">{t('status.pending')}</option>
                    <option value="reviewed">{t('status.reviewed')}</option>
                    <option value="expired">{t('status.expired')}</option>
                </select>
            </div>
            <Button
                onClick={onNewAsset}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-6"
            >
                <Plus size={18} />
                {t('actions.new')}
            </Button>
        </div>
    );
}
