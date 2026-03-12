"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Sparkles,
    Trash2,
    FileText,
    History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { KnowledgeAsset } from "@/types/knowledge";
import { useQuickAnalyze } from "@/hooks/useQuickAnalyze";
import { AnalyzeMessageList } from "./analyze/AnalyzeMessageList";
import { AnalyzeThoughtConsole } from "./analyze/AnalyzeThoughtConsole";
import { AnalyzeSuggestions } from "./analyze/AnalyzeSuggestions";
import { AnalyzeInput } from "./analyze/AnalyzeInput";

interface QuickAnalyzeModalProps {
    asset: KnowledgeAsset | null;
    open: boolean;
    onClose: () => void;
}

/**
 * QuickAnalyzeModal — ERA 14 Refactor
 * Refactored to use useQuickAnalyze hook and modular sub-components.
 * Follows SRP and improves maintainability.
 */
export function QuickAnalyzeModal({ asset, open, onClose }: QuickAnalyzeModalProps) {
    const t = useTranslations("knowledge_hub");

    const {
        question,
        setQuestion,
        isQuerying,
        messages,
        setMessages,
        status,
        traces,
        showTraces,
        setShowTraces,
        dynamicSuggestions,
        isLoadingSuggestions,
        handleAsk
    } = useQuickAnalyze({
        assetId: asset?._id,
        filename: asset?.filename,
        open
    });

    if (!asset) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950">
                {/* Header */}
                <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                {t('analyze_modal.title')}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-0.5">
                                <FileText size={14} className="text-slate-400" />
                                <span className="truncate max-w-[400px]">{asset.filename}</span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1 bg-white dark:bg-slate-800">
                                    {asset.usage === 'TRANSACTIONAL' ? 'Transactional' : 'Reference'}
                                </Badge>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMessages([])}
                                    title={t('analyze_modal.actions.reset')}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowTraces(!showTraces)}
                                className={`rounded-xl h-10 px-4 border-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                                    showTraces 
                                        ? "bg-slate-900 border-slate-800 text-teal-400 shadow-lg" 
                                        : "hover:border-teal-500/50 text-slate-500"
                                }`}
                            >
                                {showTraces ? "Disable Debug" : "Deep Tracing"}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <AnalyzeMessageList 
                    messages={messages}
                    isQuerying={isQuerying}
                    status={status}
                />

                <AnalyzeThoughtConsole 
                    traces={traces}
                    showTraces={showTraces}
                />

                <AnalyzeSuggestions 
                    suggestions={dynamicSuggestions}
                    isLoading={isLoadingSuggestions}
                    onSelect={handleAsk}
                    disabled={isQuerying}
                />

                <AnalyzeInput 
                    value={question}
                    onChange={setQuestion}
                    onSend={handleAsk}
                    disabled={isQuerying}
                />

                <p className="p-3 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800 uppercase tracking-widest font-semibold flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/30">
                    <Sparkles size={12} className="text-teal-500" />
                    {t('analyze_modal.chat.footer_note')}
                </p>
            </DialogContent>
        </Dialog>
    );
}
