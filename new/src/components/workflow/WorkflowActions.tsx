'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Send,
    CheckCircle,
    XCircle,
    MessageSquare,
    Lock,
    Loader2
} from 'lucide-react';
import { WorkflowTransition, WorkflowState } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface WorkflowActionsProps {
    pedidoId: string;
    currentStateId: string;
    transitions: WorkflowTransition[];
    userRole: string;
    onTransitionComplete?: (newStatus: string) => void;
}

/**
 * WorkflowActions: Panel de control para ejecutar transiciones de estado.
 * Fase 7.2: Automatización de Negocio y SaaS Ready.
 */
export const WorkflowActions = ({
    pedidoId,
    currentStateId,
    transitions,
    userRole,
    onTransitionComplete
}: WorkflowActionsProps) => {
    const t = useTranslations('admin.workflows.actions');
    const [loading, setLoading] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Filtrar transiciones válidas para el estado actual y el rol del usuario
    const availableTransitions = transitions.filter(t =>
        t.from === currentStateId &&
        (!t.required_role || t.required_role.includes(userRole))
    );

    const handleTransition = async (transition: WorkflowTransition) => {
        setLoading(transition.to);
        setError(null);

        try {
            const response = await fetch(`/api/pedidos/${pedidoId}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toState: transition.to,
                    comment: comment || undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || t('error_transition'));
            }

            // Éxito: Limpiar comentario y refrescar datos
            setComment('');
            router.refresh(); // Refresca la página para ver los cambios
            if (onTransitionComplete) onTransitionComplete(transition.to);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(null);
        }
    };

    if (availableTransitions.length === 0) {
        return (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-400">
                    <Lock className="w-5 h-5" />
                    <p className="text-sm font-medium">{t('no_actions')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Input de Comentario (Si alguna transición lo requiere o como buena práctica) */}
            <div className="relative group">
                <div className="absolute top-3 left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('comment_placeholder')}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none min-h-[80px]"
                />
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-3">
                {availableTransitions.map((transition) => (
                    <motion.button
                        key={transition.to}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading !== null}
                        onClick={() => handleTransition(transition)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm",
                            transition.action === 'REJECT'
                                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200"
                                : "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200 dark:shadow-teal-900/20",
                            loading === transition.to && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        {loading === transition.to ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            transition.action === 'REJECT' ? <XCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />
                        )}
                        {transition.label}
                    </motion.button>
                ))}
            </div>

            {/* Mensajes de Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-xs"
                >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                </motion.div>
            )}
        </div>
    );
};
