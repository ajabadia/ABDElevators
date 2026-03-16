'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
    Loader2,
    Sparkles,
    ShieldCheck,
    Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { logEvento } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors-helpers';

interface PromptSyncPortalProps {
    isSyncing: boolean;
    setIsSyncing: (val: boolean) => void;
    fetchPrompts: () => void;
    environment: string;
    selectedPromptId?: string;
}

/**
 * 🔗 PromptSyncPortal Component
 * SRP: Responsable de las acciones de sincronización (Code-to-DB) y promoción entre entornos.
 * Regla #4: Structured Logging implementado.
 */
export function PromptSyncPortal({
    isSyncing,
    setIsSyncing,
    fetchPrompts,
    environment,
    selectedPromptId
}: PromptSyncPortalProps) {
    const t = useTranslations('admin_prompts');

    const handleSyncFromCode = async () => {
        const correlationId = CorrelationIdService.generate();
        await logEvento({
            level: 'INFO',
            source: 'API_PROMPTS',
            action: 'SYNC_FROM_CODE_INIT',
            correlationId,
            message: 'Iniciando sincronización de prompts desde código a DB'
        });

        try {
            setIsSyncing(true);
            const res = await fetch('/api/admin/prompts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Error en la sincronización");
            }

            // Actualizar lista
            fetchPrompts();

            await logEvento({
                level: 'INFO',
                source: 'API_PROMPTS',
                action: 'SYNC_FROM_CODE_SUCCESS',
                correlationId,
                message: 'Sincronización de prompts completada con éxito',
                details: json.stats || json.results
            });

            toast.success(t('messages.sync_success_title'), {
                description: t('messages.sync_success', {
                    created: json.stats?.created ?? json.results?.created ?? 0,
                    updated: json.stats?.updated ?? json.results?.updated ?? 0,
                    errors: json.stats?.errors ?? 0
                })
            });
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            await logEvento({
                level: 'ERROR',
                source: 'API_PROMPTS',
                action: 'SYNC_FROM_CODE_ERROR',
                correlationId,
                message,
                details: { stack: error instanceof Error ? error.stack : undefined }
            });

            toast.error(t('messages.sync_error'), {
                description: message
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePromote = async () => {
        if (!selectedPromptId) return;

        const correlationId = CorrelationIdService.generate();
        await logEvento({
            level: 'INFO',
            source: 'API_PROMPTS',
            action: 'PROMOTE_PROMPT_INIT',
            correlationId,
            message: 'Iniciando promoción de prompt entre entornos',
            details: { promptId: selectedPromptId }
        });

        try {
            const res = await fetch(`/api/admin/environments/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'PROMPT',
                    id: selectedPromptId
                })
            });
            const json = await res.json();

            if (!json.success) throw new Error(json.message);

            await logEvento({
                level: 'INFO',
                source: 'API_PROMPTS',
                action: 'PROMOTE_PROMPT_SUCCESS',
                correlationId,
                message: 'Promoción de prompt completada con éxito',
                details: { promptId: selectedPromptId }
            });

            toast.success(t('messages.promote_success'), {
                description: t('messages.promote_desc')
            });
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            await logEvento({
                level: 'ERROR',
                source: 'API_PROMPTS',
                action: 'PROMOTE_PROMPT_ERROR',
                correlationId,
                message
            });

            toast.error("Error", {
                description: message
            });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={isSyncing}
                        variant="outline"
                        className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/10"
                    >
                        {isSyncing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {t('sync')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem] border-slate-100 dark:border-slate-800">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-teal-600" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight">
                            {t('sync_modal.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground">
                            {t('sync_modal.description', { codePath: 'src/lib/prompts.ts' })}
                            <br /><br />
                            <span className="font-bold text-foreground">{t('sync_modal.governance')}</span> {t('sync_modal.governance_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold">{t('sync_modal.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSyncFromCode}
                            className="rounded-xl h-12 font-bold bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            {t('sync_modal.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {environment === 'STAGING' && selectedPromptId && (
                <Button
                    onClick={handlePromote}
                    variant="outline"
                    className="rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-900/10 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                >
                    <Rocket className="w-4 h-4 mr-2" /> {t('actions.promote')}
                </Button>
            )}
        </div>
    );
}
