"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PreviewModal } from './PreviewModal';
import { useConfiguratorStore } from '@/store/configurator-store';

export function ConfiguratorPreview() {
    const { config } = useConfiguratorStore();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 bg-slate-900 p-12 overflow-y-auto pattern-grid-slate-800 h-full"
        >
            <PreviewModal config={config} />

            <style jsx global>{`
                .pattern-grid-slate-800 {
                    background-image: radial-gradient(circle, #334155 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
        </motion.div>
    );
}
