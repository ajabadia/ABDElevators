"use client";

import React, { useState } from 'react';
import { AlertCircle, RotateCcw, MessageSquare, Send, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface SupportErrorStateProps {
    error: Error & { digest?: string };
    reset: () => void;
    retryAction?: () => Promise<void> | void;
    context?: string;
}

/**
 * SupportErrorState - Componente unificado de error con integración de soporte.
 * Sigue los estándares Uncodixify (Normal UI).
 */
export function SupportErrorState({ error, reset, retryAction, context }: SupportErrorStateProps) {
    const t = useTranslations('common.errors');
    const tSupport = useTranslations('support.new');
    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    const errorDetails = `
Error Details:
---
Message: ${error.message}
Digest: ${error.digest || 'N/A'}
Context: ${context || 'N/A'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Timestamp: ${new Date().toISOString()}
---
`.trim();

    const [ticketData, setTicketData] = useState({
        subject: `[ERROR] ${context || 'Sistema'}: ${error.message.substring(0, 50)}`,
        description: `${errorDetails}\n\nPor favor, describa qué estaba haciendo cuando ocurrió el error:\n`
    });

    const handleCopyDetails = () => {
        navigator.clipboard.writeText(errorDetails);
        setCopied(true);
        toast.success('Detalles copiados al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...ticketData,
                    category: 'TECHNICAL',
                    priority: 'HIGH'
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(tSupport('success'), {
                    description: `${tSupport('successDesc')} (${data.ticket.ticketNumber})`
                });
                setIsTicketOpen(false);
            } else {
                throw new Error('Failed to create ticket');
            }
        } catch (err) {
            toast.error(tSupport('error'), { description: tSupport('errorCreate') });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-6 min-h-[400px]">
            <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="h-1 bg-red-500 w-full" />
                <CardContent className="p-8 text-center space-y-6">
                    <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {t('title') || 'Interrupción de Servicio'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t('subtitle') || 'Se ha detectado una anomalía técnica que impide continuar.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={retryAction || reset}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-950 h-10 rounded-lg font-bold text-sm"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> {t('retry') || 'Reintentar'}
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCopyDetails}
                                className="border-slate-200 dark:border-slate-800 h-10 rounded-lg font-bold text-slate-600 dark:text-slate-400 text-sm"
                            >
                                {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copied ? 'Copiado' : 'Copiar info'}
                            </Button>

                            <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-slate-200 dark:border-slate-800 h-10 rounded-lg font-bold text-slate-600 dark:text-slate-400 text-sm"
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        {t('reportIssue') || 'Soporte'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] border-slate-200 dark:border-slate-800 rounded-xl">
                                    <form onSubmit={handleCreateTicket}>
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight">Reportar Error Técnico</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-slate-500">Asunto</Label>
                                                <Input
                                                    id="subject"
                                                    value={ticketData.subject}
                                                    onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                                    className="rounded-lg h-10 border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-slate-400"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Descripción Detallada</Label>
                                                <Textarea
                                                    id="description"
                                                    value={ticketData.description}
                                                    onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                                                    className="min-h-[150px] rounded-lg text-xs font-mono border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-slate-400"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setIsTicketOpen(false)}
                                                className="rounded-lg h-10 font-bold"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-6 font-bold"
                                            >
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Enviar Reporte
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
