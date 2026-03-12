"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { humanizeConfidence, confidencePercent } from "@/lib/confidence-humanizer";

interface SourceChipProps {
    doc: any;
    onPreview: (id: string, filename: string, page?: number) => void;
}

/**
 * SourceChip — ERA 14 Refactor
 * Renders a single source indicator with preview capability and confidence score.
 */
export function SourceChip({ doc, onPreview }: SourceChipProps) {
    const t = useTranslations("common.navigation.search");
    const fileName = doc.source.split('/').pop().replace('.pdf', '').replace(/_/g, ' ');
    const conf = doc.score != null ? humanizeConfidence(doc.score) : null;

    // Try to get asset ID from various metadata sources
    const assetId = doc.metadata?.assetId || doc.id || doc._id;

    const handlePreview = (e: React.MouseEvent) => {
        if (assetId) {
            e.preventDefault();
            onPreview(assetId, fileName, doc.approxPage);
        }
    };

    return (
        <a
            href={doc.cloudinaryUrl || "#"}
            onClick={handlePreview}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary transition-all group shadow-sm"
            aria-label={`${t("view_source")}: ${fileName}`}
        >
            <FileText className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
            <div className="flex flex-col text-left leading-none gap-0.5">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px] group-hover:text-primary">
                    {fileName}
                </span>
                <div className="flex items-center gap-2">
                    {doc.approxPage && (
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                            p.{doc.approxPage}
                        </span>
                    )}
                    {conf && (
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter flex items-center gap-0.5", conf.colorClass)}>
                            {conf.icon} {confidencePercent(doc.score)}%
                        </span>
                    )}
                </div>
            </div>
        </a>
    );
}
