"use client";

import React, { useState, useRef } from 'react';
import { Trash2, Loader2, AlertTriangle, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OptimisticDeleteProps {
    itemId: string;
    onDelete: (id: string) => Promise<void>;
    onSuccess?: () => void;
    className?: string;
    label?: string;
    variant?: "ghost" | "outline" | "destructive";
    undoTimeout?: number;
}

/**
 * Componente de eliminación con UI optimista y capacidad de deshacer.
 * Regla de Oro #4: Tolerancia a errores y control del usuario.
 */
export function OptimisticDelete({
    itemId,
    onDelete,
    onSuccess,
    className,
    label,
    variant = "ghost",
    undoTimeout = 4000
}: OptimisticDeleteProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showUndo, setShowUndo] = useState(false);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleDeleteClick = () => {
        setShowUndo(true);

        // Iniciar cuenta regresiva para la eliminación real
        undoTimeoutRef.current = setTimeout(async () => {
            setShowUndo(false);
            setIsDeleting(true);
            try {
                await onDelete(itemId);
                toast({
                    title: "Eliminado con éxito",
                    description: "El elemento ha sido removido permanentemente."
                });
                onSuccess?.();
            } catch (error) {
                toast({
                    title: "Error al eliminar",
                    description: "No se pudo completar la operación.",
                    variant: "destructive"
                });
            } finally {
                setIsDeleting(false);
            }
        }, undoTimeout);
    };

    const handleUndo = () => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
        setShowUndo(false);
        toast({
            title: "Acción cancelada",
            description: "El elemento no ha sido eliminado."
        });
    };

    return (
        <div className={cn("inline-flex items-center", className)}>
            <AnimatePresence mode="wait">
                {showUndo ? (
                    <motion.div
                        key="undo"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-3 py-1.5 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Eliminando en segundos...</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUndo}
                            className="h-7 px-2 text-[10px] font-bold bg-white dark:bg-slate-900 text-amber-600 hover:text-amber-700 hover:bg-amber-100 border border-amber-200"
                        >
                            <Undo2 size={12} className="mr-1" /> DESHACER
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Button
                            variant={variant}
                            size={label ? "sm" : "icon"}
                            disabled={isDeleting}
                            onClick={handleDeleteClick}
                            className={cn(
                                "transition-all duration-300",
                                variant === "ghost" && "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20",
                                isDeleting && "opacity-50"
                            )}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    {label && <span className="ml-2 font-bold uppercase tracking-widest text-[10px]">{label}</span>}
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
