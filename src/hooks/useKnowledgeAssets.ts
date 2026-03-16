"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from '@/lib/errors-helpers';
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCsrfToken } from "next-auth/react";
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
        total,
        rawResponse
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

    const handleReviewSubmit = async (actionParam?: 'review' | 'snooze') => {
        const action = (typeof actionParam === 'string') ? actionParam : 'review';
        if (modalState.type !== 'review' && action === 'review') return;
        
        const id = modalState.type === 'review' ? modalState.asset._id : (modalState as any).asset?._id;
        if (!id && action === 'review') return;

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/admin/knowledge-assets/${id}/review`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                body: JSON.stringify({ 
                    action,
                    nextReviewDate: action === 'review' ? reviewDate : undefined 
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Review update failed");
            }

            toast.success(action === 'review' ? t('review.success') : t('snooze_success') || 'Revisión pospuesta');
            setModalState({ type: 'closed' });
            refresh();
        } catch (error: unknown) {
            console.error("Review Error:", error);
            toast.error(t('review.error') || "Error al actualizar la revisión", {
                description: getErrorMessage(error)
            });
        }
    };

    // 4. Effects
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const isCurrentlyProcessing = documents.some(d =>
            d.ingestionStatus === 'PROCESSING' ||
            d.ingestionStatus === 'PENDING' ||
            d.ingestionStatus === 'EXTRACTING' ||
            d.ingestionStatus === 'CHUNKING' ||
            d.ingestionStatus === 'EMBEDDING' ||
            d.ingestionStatus === 'INDEXING'
        );

        if (isCurrentlyProcessing && !isLoading) {
            // Poll every 5 seconds if processing, more stable
            const interval = setInterval(() => {
                refresh();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [documents.map(d => d.ingestionStatus).join(','), isLoading, refresh]);

    // 5. Derived State
    const serverData = rawResponse?.stats;
    
    const stats = {
        active: serverData?.active ?? documents.filter(d => d.status === 'ACTIVE').length,
        totalChunks: serverData?.totalChunks ?? documents.reduce((acc, d) => acc + (Number(d.totalChunks) || 0), 0),
        lastIngest: serverData?.lastIngest 
            ? new Date(serverData.lastIngest).toLocaleString()
            : (documents.length > 0 ? new Date(documents[0].createdAt).toLocaleString() : '-')
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
