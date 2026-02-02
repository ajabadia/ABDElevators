"use client";

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChecklistConfig } from '@/lib/types';
import { useConfiguratorStore } from '@/store/configurator-store';
import { ConfiguratorToolbar } from './ConfiguratorToolbar';
import { CategoriesSidebar } from './CategoriesSidebar';
import { CategoryEditor } from './CategoryEditor';
import { ConfiguratorPreview } from './ConfiguratorPreview';

interface ConfiguratorFullProps {
    initialConfig?: ChecklistConfig;
    isNew?: boolean;
}

export function ConfiguratorFull({ initialConfig, isNew = false }: ConfiguratorFullProps) {
    const { init, activeTab } = useConfiguratorStore();

    useEffect(() => {
        if (initialConfig) {
            init(initialConfig);
        } else if (isNew) {
            // Re-init with defaults if it's new
            init({
                _id: '',
                tenantId: '',
                name: 'Nueva Configuración',
                categories: [],
                items: [],
                workflowOrder: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }, [initialConfig, isNew, init]);

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 overflow-hidden font-sans text-slate-200">
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
                            <section className="flex-1 bg-slate-950 p-8 overflow-y-auto">
                                <CategoryEditor />
                            </section>
                        </motion.div>
                    ) : (
                        <ConfiguratorPreview />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
