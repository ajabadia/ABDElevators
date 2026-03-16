"use client";

import React from 'react';
import { KnowledgeAssetsManager } from '@/components/admin/knowledge/KnowledgeAssetsManager';
import { ConversationalSearch } from '@/components/shared/ConversationalSearch';
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

interface MyDocsClientProps {
    userId: string;
}

/**
 * 📂 My Docs Client (Audit Refactor Phase 345)
 * Standardized i18n and UI layout using SplitPanel primitives.
 */
export function MyDocsClient({ userId }: MyDocsClientProps) {
    const t = useTranslations('myDocuments');

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 mt-6 pb-12">
            {/* 1. Main Content Area */}
            <div className="w-full space-y-8">
                
                {/* 2. Knowledge Manager with Assistant Integration */}
                <KnowledgeAssetsManager
                    scope="user"
                    userId={userId}
                    renderAssistant={
                        /* Phase 345: Centralized Assistant as requested */
                        <div className="w-full flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between">
                                <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tighter">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    {t('detail.analyzingContext')}
                                </h3>
                                <Badge variant="outline" className="text-[10px] bg-background border-border uppercase tracking-tight font-bold">
                                    IA Dynamic Focus
                                </Badge>
                            </div>
                            <div className="h-[500px] overflow-hidden bg-card/10">
                                <ConversationalSearch hideHeader />
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
