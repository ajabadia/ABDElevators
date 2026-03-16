"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle,
    AlertTriangle,
    BrainCircuit
} from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';
import { ValidationWorkflow } from '@/components/entities/ValidationWorkflow';
import Link from 'next/link';
import { AgentTraceViewer } from '@/components/agent/AgentTraceViewer';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useEntity } from '@/hooks/useEntity';
import { toast } from 'sonner';
import { getCsrfToken } from "next-auth/react";

interface ValidationClientProps {
    id: string;
    initialOrder?: any;
}

/**
 * 🛠️ ValidationClient
 * Client component to handle interactive validation workflow.
 * Part of Phase 412: Zero-Waterfall.
 */
export function ValidationClient({ id, initialOrder }: ValidationClientProps) {
    const t = useTranslations('technical.validation');
    const router = useRouter();

    // Use Entity Hook (Consolidation)
    const {
        entity: order,
        isLoading,
        setEntity: setOrder
    } = useEntity('order', id);

    // Derive RAG Results when entity is loaded
    const ragResults = order ? {
        model: order.detectedPatterns?.[0]?.model || "Not detected",
        orderNumber: order.identifier,
        client: order.client || "Not specified",
    } : null;

    const [validationComplete, setValidationComplete] = useState(false);
    const [showAgentTrace, setShowAgentTrace] = useState(false);

    const handleValidationComplete = (validation: any) => {
        setValidationComplete(true);
        toast.success(t('validationSuccess'), {
            description: `${t('status')}: ${validation.generalStatus}`
        });
        if (validation.generalStatus === 'APPROVED') {
            router.push(`/work/orders/${id}`);
        }
    };

    const handleAgentComplete = async () => {
        setShowAgentTrace(false);
        // useEntity handles the refresh if properly configured, 
        // otherwise we can manually trigger a refetch here.
    };

    if (isLoading && !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <LoadingState message={t('loadingEngine')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/work/orders`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
                                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    {t('entityLabel')} {order?.identifier}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('status')}: <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{order?.status || 'entered'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {validationComplete ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                            {t('completed')}
                        </h2>
                        <p className="text-emerald-700 dark:text-emerald-300 mb-6">
                            {t('completedDesc')}
                        </p>
                        <Link
                            href={`/work/orders/${id}`}
                            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                        >
                            {t('viewEntity')}
                        </Link>
                    </div>
                ) : ragResults ? (
                    <ValidationWorkflow
                        entityId={id}
                        ragResults={ragResults}
                        onValidationComplete={handleValidationComplete}
                    />
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8">
                        {!showAgentTrace ? (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center space-y-6">
                                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                        {t('noRagResults')}
                                    </h2>
                                    <p className="text-amber-700 dark:text-amber-300">
                                        {t('noRagDesc')}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowAgentTrace(true)}
                                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-6 rounded-xl shadow-lg gap-2"
                                >
                                    <BrainCircuit size={20} /> {t('startAgent')}
                                </Button>
                            </div>
                        ) : (
                            <AgentTraceViewer
                                correlationId={id}
                                onStartRequested={async () => {
                                    const csrfToken = await getCsrfToken();
                                    const res = await fetch(`/api/core/entities/order/${id}/analyze`, { 
                                        method: 'POST',
                                        headers: {
                                            'X-CSRF-Token': csrfToken || ''
                                        }
                                    });
                                    if (!res.ok) {
                                        const errorData = await res.json();
                                        throw new Error(errorData.message || 'Error starting analysis');
                                    }
                                    const data = await res.json();
                                    if (!data.success || !data.jobId) {
                                        throw new Error('No jobId received from server');
                                    }
                                    return data.jobId;
                                }}
                                onComplete={handleAgentComplete}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
