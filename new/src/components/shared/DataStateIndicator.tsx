"use client";

import React from 'react';
import { Loader2, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DataStateIndicatorProps {
    isLoading: boolean;
    isFetching?: boolean;
    isError?: boolean;
    isCached?: boolean;
    className?: string;
    showText?: boolean;
}

/**
 * Indicador visual del estado de sincronización y carga de datos.
 * Regla de Oro #8: Visibilidad del sistema.
 */
export function DataStateIndicator({
    isLoading,
    isFetching,
    isError,
    isCached,
    className,
    showText = true
}: DataStateIndicatorProps) {
    return (
        <div className={cn("flex items-center gap-2 text-[10px] font-medium transition-all", className)}>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-slate-400"
                    >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {showText && <span className="uppercase tracking-widest">Cargando</span>}
                    </motion.div>
                )}

                {isFetching && !isLoading && (
                    <motion.div
                        key="fetching"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-amber-500"
                    >
                        <Zap className="h-3.5 w-3.5 animate-pulse fill-amber-500/20" />
                        {showText && <span className="uppercase tracking-widest">Sincronizando</span>}
                    </motion.div>
                )}

                {isError && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-rose-500"
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {showText && <span className="uppercase tracking-widest font-bold">Error de Conexión</span>}
                    </motion.div>
                )}

                {!isLoading && !isFetching && !isError && isCached && (
                    <motion.div
                        key="cached"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-emerald-500"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {showText && <span className="uppercase tracking-widest">Confirmado</span>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
