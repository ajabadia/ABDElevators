"use client";

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChecklistConfig } from '@/lib/types';
import { useConfiguratorStore } from '@/store/configurator-store';
import { ConfiguratorToolbar } from './ConfiguratorToolbar';
import { CategoriesSidebar } from './CategoriesSidebar';
import { CategoryEditor } from './CategoryEditor';
import { ConfiguratorPreview } from './ConfiguratorPreview';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/page-container';

interface ConfiguratorFullProps {
    initialConfig?: ChecklistConfig;
    isNew?: boolean;
}

export function ConfiguratorFull({ initialConfig, isNew = false }: ConfiguratorFullProps) {
    const t = useTranslations('admin.configurator');
    const { init, activeTab } = useConfiguratorStore();

    useEffect(() => {
        if (initialConfig) {
            init(initialConfig);
        } else if (isNew) {
            // Re-init with defaults if it's new
            init({
                _id: '',
                id: '',
                tenantId: '',
                title: t('new_title'),
                name: t('new_title'),
                categories: [] as any[],
                items: [] as any[],
                workflowOrder: [] as any[],
                version: 1,
                active: true,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }, [initialConfig, isNew, init]);

    return (
        <PageContainer className="p-0 h-[calc(100vh-120px)]">
            <div className="relative h-full flex flex-col bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden font-sans text-foreground transition-colors duration-300">
                <ConfiguratorToolbar />

                <main className="flex-1 flex overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'editor' ? (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex w-full h-full"
                            >
                                <CategoriesSidebar />
                                <section className="flex-1 bg-background p-8 overflow-y-auto custom-scrollbar">
                                    <CategoryEditor />
                                </section>
                            </motion.div>
                        ) : (
                            <ConfiguratorPreview />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </PageContainer>
    );
}
