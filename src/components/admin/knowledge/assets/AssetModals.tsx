"use client";

import React from 'react';
import { UnifiedIngestModal } from "@/components/admin/knowledge/UnifiedIngestModal";
import { EnrichmentModal } from "@/components/admin/knowledge/EnrichmentModal";
import { PDFPreviewModal } from "@/components/admin/knowledge/PDFPreviewModal";
import { RelationshipManagerModal } from "@/components/admin/knowledge/RelationshipManagerModal";
import { IngestionDiagnosticModal } from "@/components/admin/knowledge/IngestionDiagnosticModal";
import { QuickAnalyzeModal } from "@/components/admin/knowledge/QuickAnalyzeModal";
import { ChunksViewModal } from "@/components/admin/knowledge/ChunksViewModal";
import { DocumentSpaceManager } from "@/components/admin/knowledge/DocumentSpaceManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { ModalState } from "@/hooks/useKnowledgeAssets";

interface AssetModalsProps {
    modalState: ModalState;
    onClose: () => void;
    refresh: () => void;
    reviewDate: string;
    onReviewDateChange: (val: string) => void;
    onReviewSubmit: () => void;
}

/**
 * AssetModals — ERA 14 Refactor
 * Orchestrates the many modals used in KnowledgeAssetsManager.
 */
export function AssetModals({
    modalState,
    onClose,
    refresh,
    reviewDate,
    onReviewDateChange,
    onReviewSubmit
}: AssetModalsProps) {
    const t = useTranslations('knowledge_assets');
    const tCommon = useTranslations('common');

    return (
        <>
            <UnifiedIngestModal
                isOpen={modalState.type === 'upload'}
                onClose={() => {
                    onClose();
                    refresh();
                }}
            />

            <EnrichmentModal
                isOpen={modalState.type === 'enrich'}
                onClose={onClose}
                asset={modalState.type === 'enrich' ? modalState.asset : null}
                onSuccess={() => {
                    refresh();
                    onClose();
                }}
            />

            <DocumentSpaceManager
                isOpen={modalState.type === 'spaces'}
                onClose={() => {
                    onClose();
                    refresh();
                }}
                asset={modalState.type === 'spaces' ? modalState.asset : null as any}
            />

            <PDFPreviewModal
                isOpen={modalState.type === 'preview'}
                onClose={onClose}
                id={modalState.type === 'preview' ? modalState.id : ""}
                filename={modalState.type === 'preview' ? modalState.filename : ""}
            />

            <RelationshipManagerModal
                isOpen={modalState.type === 'relationship'}
                onClose={() => {
                    onClose();
                    refresh();
                }}
                asset={modalState.type === 'relationship' ? modalState.asset : null as any}
            />

            <IngestionDiagnosticModal
                isOpen={modalState.type === 'diagnostic'}
                onClose={onClose}
                assetId={modalState.type === 'diagnostic' ? modalState.id : ""}
                filename={modalState.type === 'diagnostic' ? modalState.filename : ""}
            />

            <Dialog open={modalState.type === 'review'} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('review.dialog_title')}</DialogTitle>
                        <DialogDescription>{t('review.dialog_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="date"
                            value={reviewDate}
                            onChange={(e) => onReviewDateChange(e.target.value)}
                            min={format(new Date(), "yyyy-MM-dd")}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>{tCommon('actions.cancel')}</Button>
                        <Button onClick={() => onReviewSubmit()}>{tCommon('actions.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QuickAnalyzeModal
                asset={modalState.type === 'analyze' ? modalState.asset : null}
                open={modalState.type === 'analyze'}
                onClose={onClose}
            />

            <ChunksViewModal
                asset={modalState.type === 'chunks' ? modalState.asset : null}
                open={modalState.type === 'chunks'}
                onClose={onClose}
            />
        </>
    );
}
