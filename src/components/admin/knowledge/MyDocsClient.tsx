"use client";

import React from 'react';
import { KnowledgeAssetsManager } from '@/components/admin/knowledge/KnowledgeAssetsManager';
import { SplitPanel, SplitPanelLeft, SplitPanelRight } from '@/components/shared/SplitPanel';
import { ConversationalSearch } from '@/components/shared/ConversationalSearch';
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
        <div className="h-[calc(100vh-12rem)] min-h-[600px] animate-in fade-in duration-500 mt-6">
            <SplitPanel layout="60/40">
                <SplitPanelLeft className="h-full">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
                        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                    </div>
                    <KnowledgeAssetsManager
                        scope="user"
                        userId={userId}
                    />
                </SplitPanelLeft>

                <SplitPanelRight className="h-full">
                    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border bg-card/60 backdrop-blur-sm">
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tighter">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                {t('detail.analyzingContext')}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto bg-card/10">
                            <ConversationalSearch hideHeader />
                        </div>
                    </div>
                </SplitPanelRight>
            </SplitPanel>
        </div>
    );
}
