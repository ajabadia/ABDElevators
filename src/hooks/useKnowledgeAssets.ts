"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiOptimistic } from "@/hooks/useApiOptimistic";
import { logClientEvent } from "@/lib/logger-client";
import { KnowledgeAsset, AssetStatus } from "@/types/knowledge";

export type ModalState =
    | { type: 'closed' }
    | { type: 'upload' }
    | { type: 'preview', id: string, filename: string }
    | { type: 'relationship', asset: KnowledgeAsset }
    | { type: 'diagnostic', id: string, filename: string }
    | { type: 'review', asset: KnowledgeAsset }
    | { type: 'analyze', asset: KnowledgeAsset }
    | { type: 'enrich', asset: KnowledgeAsset }
    | { type: 'chunks', asset: KnowledgeAsset }
    | { type: 'spaces', asset: KnowledgeAsset };

interface UseKnowledgeAssetsProps {
    scope?: 'all' | 'user';
    userId?: string;
    spacePath?: string;
}

/**
 * useKnowledgeAssets — ERA 14 Refactor
 * Centralizes logic for KnowledgeAssetsManager.
 */
export function useKnowledgeAssets({ scope = 'all', userId, spacePath }: UseKnowledgeAssetsProps = {}) {
    const t = useTranslations('knowledge_assets');
    const tCommon = useTranslations('common');

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [reviewFilter, setReviewFilter] = useState<string>("all");
    const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });
    const [reviewDate, setReviewDate] = useState<string>(
        format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd")
    );

    // Pagination
    const [page, setPage] = useState(1);
    const limit = 10;

    // 1. Data Fetching
    const {
        data: documents,
        isLoading,
        refresh,
        setData,
        total
    } = useApiList<KnowledgeAsset>({
        endpoint: '/api/admin/knowledge-assets',
        filters: {
            q: searchTerm,
            page: page,
            limit: limit,
            scope: scope,
            userId: userId,
            spacePath: spacePath,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            reviewStatus: reviewFilter !== 'all' ? reviewFilter : undefined
        },
        dataKey: 'data'
    });

    const { updateOptimistic, deleteOptimistic } = useApiOptimistic(documents, setData);

    // 2. Mutations
    const statusMutation = useApiMutation({
        endpoint: '/api/admin/knowledge-assets/status',
        method: 'PATCH',
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'INFO',
                source: 'UI_DOCS',
                action: 'STATUS_CHANGE',
                message: 'Document status updated',
            });
        }
    });

    const deleteMutation = useApiMutation({
        endpoint: (id) => `/api/admin/knowledge-assets/${id}`,
        method: 'DELETE',
        confirmMessage: (id) => t('delete_confirm'),
        onSuccess: () => {
            refresh();
            logClientEvent({
                level: 'WARN',
                source: 'UI_DOCS',
                action: 'DELETE_DOC',
                message: 'Document deleted from corpus',
            });
        }
    });

    // 3. Handlers
    const handleStatusChange = async (documentId: string, newStatus: AssetStatus) => {
        updateOptimistic(documentId, { status: newStatus });
        try {
            await statusMutation.mutate({ documentId, status: newStatus });
            toast.success(tCommon('success.update_status') || 'Estado actualizado');
        } catch (error: unknown) {
            refresh();
            toast.error(tCommon('errors.update_failed') || 'Error al actualizar');
        }
    };

    const handleDelete = async (documentId: string) => {
        const originalData = [...documents];
        deleteOptimistic(documentId);
        try {
            await deleteMutation.mutate(documentId);
            toast.success(tCommon('success.delete') || 'Documento eliminado');
        } catch (error: unknown) {
            setData(originalData);
            toast.error(tCommon('errors.delete_failed') || 'Error al eliminar');
        }
    };

    const handleReviewSubmit = async () => {
        if (modalState.type !== 'review') return;
        try {
            const res = await fetch(`/api/admin/knowledge-assets/${modalState.asset._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nextReviewDate: reviewDate })
            });

            if (!res.ok) throw new Error("Review update failed");

            toast.success(t('review.success'));
            setModalState({ type: 'closed' });
            refresh();
        } catch (error) {
            toast.error(t('review.error'));
        }
    };

    // 4. Effects
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const processingItems = documents.filter(d =>
            d.ingestionStatus === 'PROCESSING' ||
            d.ingestionStatus === 'PENDING'
        );

        if (processingItems.length > 0) {
            const intervalMs = Math.min(3000 + (processingItems.length * 1000), 10000);
            const interval = setInterval(refresh, intervalMs);
            return () => clearInterval(interval);
        }
    }, [documents, refresh]);

    // 5. Derived State
    const stats = {
        active: documents.filter(d => ['vigente', 'active'].includes(d.status)).length,
        totalChunks: documents.reduce((acc, d) => acc + (d.totalChunks || 0), 0),
        lastIngest: documents.length > 0 ? new Date(documents[0].createdAt).toLocaleString() : '-'
    };

    const totalPages = Math.ceil((total || 0) / limit);

    return {
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
        limit,
        
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
    };
}
