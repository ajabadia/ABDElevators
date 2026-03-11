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
        toast.success(t('copied') || 'Detalles copiados al portapapeles');
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
        <div className="flex items-center justify-center p-6 min-h-[400px] font-outfit relative overflow-hidden">
            {/* 🌌 Local Cinematic Context (Subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/10 blur-[80px] rounded-full" />
            </div>

            <Card className="max-w-md w-full border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900/40 backdrop-blur-3xl relative z-10 transition-all duration-500 group">
                <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 w-full opacity-60 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-10 text-center space-y-8">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/10 group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-white tracking-tight italic uppercase leading-none">
                            {t('title') || 'Interrupción de Servicio'}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                            {t('subtitle') || 'Se ha detectado una anomalía técnica que impide continuar.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={retryAction || reset}
                            className="bg-white hover:bg-slate-200 text-slate-950 h-14 rounded-2xl font-black text-base italic uppercase tracking-tight shadow-xl shadow-white/5 active:scale-[0.98] transition-all"
                        >
                            <RotateCcw className="mr-2 h-5 w-5" /> {t('retry') || 'Reintentar'}
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={handleCopyDetails}
                                className="border-white/10 bg-white/5 hover:bg-white/10 h-12 rounded-xl font-bold text-slate-400 hover:text-white text-xs uppercase tracking-widest transition-all"
                            >
                                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copied ? (t('copied') || 'Copiado') : (t('copyInfo') || 'Copiar info')}
                            </Button>

                            <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-white/10 bg-white/5 hover:bg-white/10 h-12 rounded-xl font-bold text-slate-400 hover:text-white text-xs uppercase tracking-widest transition-all"
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        {t('reportIssue') || 'Soporte'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] bg-slate-900/90 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                                    <form onSubmit={handleCreateTicket}>
                                        <DialogHeader className="p-8 pb-0">
                                            <DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tight">{t('reportTechnical') || 'Reportar Error Técnico'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-3">
                                                <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{tSupport('subject') || 'Asunto'}</Label>
                                                <Input
                                                    id="subject"
                                                    value={ticketData.subject}
                                                    onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                                    className="rounded-xl h-12 bg-slate-950/50 border-white/5 text-white placeholder:text-slate-600 focus:ring-0 focus:border-teal-500/50"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{tSupport('description') || 'Descripción Detallada'}</Label>
                                                <Textarea
                                                    id="description"
                                                    value={ticketData.description}
                                                    onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                                                    className="min-h-[150px] rounded-xl text-xs font-mono bg-slate-950/50 border-white/5 text-slate-300 placeholder:text-slate-600 focus:ring-0 focus:border-teal-500/50 resize-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="p-8 pt-0 gap-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setIsTicketOpen(false)}
                                                className="rounded-xl h-12 font-black uppercase text-xs tracking-widest text-slate-500 hover:text-white transition-colors"
                                            >
                                                {t('actions.cancel') || 'Cancelar'}
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-500 text-slate-950 rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all"
                                            >
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                {tSupport('submit') || 'Enviar Reporte'}
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
