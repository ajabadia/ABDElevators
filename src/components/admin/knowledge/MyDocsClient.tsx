"use client";

import { useState } from "react";
import { Bot, FileText } from "lucide-react";
import { SplitPanel, SplitPanelLeft, SplitPanelRight } from "@/components/shared/SplitPanel";
import { KnowledgeAssetsManager } from "@/components/admin/knowledge/KnowledgeAssetsManager";
import { ConversationalSearch } from "@/components/shared/ConversationalSearch";
import { KnowledgeAsset } from "@/types/knowledge";

interface MyDocsClientProps {
    userId?: string;
}

/**
 * MyDocsClient — Client wrapper for /admin/knowledge/my-docs
 * Adds a SplitPanel with ConversationalSearch on the right when a document is selected.
 */
export function MyDocsClient({ userId }: MyDocsClientProps) {
    const [selectedAsset, setSelectedAsset] = useState<KnowledgeAsset | null>(null);

    return (
        <SplitPanel layout="60/40" className="h-[calc(100vh-14rem)] min-h-0">
            <SplitPanelLeft className="overflow-hidden min-h-0">
                <KnowledgeAssetsManager
                    scope="user"
                    userId={userId}
                    onSelect={setSelectedAsset}
                    selectedAssetId={selectedAsset?._id}
                />
            </SplitPanelLeft>

            <SplitPanelRight className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                {selectedAsset ? (
                    <div className="h-full flex flex-col">
                        {/* Header: selected document */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">
                                    Analizando Contexto
                                </p>
                                <p
                                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate"
                                    title={selectedAsset.filename}
                                >
                                    {selectedAsset.filename}
                                </p>
                            </div>
                        </div>

                        {/* Chat panel */}
                        <div className="flex-1 overflow-hidden">
                            <ConversationalSearch filename={selectedAsset.filename} />
                        </div>
                    </div>
                ) : (
                    /* Empty state: prompt to select a document */
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Análisis de Contexto
                        </h3>
                        <p className="text-sm text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">
                            Selecciona un documento de la lista para iniciar una sesión de chat enfocada exclusivamente en su contenido.
                        </p>
                    </div>
                )}
            </SplitPanelRight>
        </SplitPanel>
    );
}
