"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WorkflowTask } from '@/lib/schemas';
import { Badge } from '@/components/ui/badge';
import {
    Paperclip,
    ExternalLink,
    Brain,
    Sparkles,
    CheckCircle,
    CheckCircle2,
    AlertTriangle,
    Clock,
    User,
    Hash,
    Loader2,
    Wrench
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { WorkshopChecklist } from './WorkshopChecklist';
import { useTranslations } from 'next-intl';

interface WorkflowTaskDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: WorkflowTask;
    onUpdate?: () => void;
}

export function WorkflowTaskDetailDialog({ open, onOpenChange, task, onUpdate }: WorkflowTaskDetailDialogProps) {
    const t = useTranslations('workshop');
    const { toast } = useToast();
    const { data: session } = useSession();
    const [status, setStatus] = useState<WorkflowTask['status']>(task.status);
    const [notes, setNotes] = useState('');
    // ⚡ FASE 128.3: Workshop Validation State
    const [checklistStatus, setChecklistStatus] = useState<Record<number, boolean>>(
        task.metadata?.workshop_validation || {}
    );

    const { mutate, isLoading } = useApiMutation({
        endpoint: `/api/admin/workflow-tasks/${task._id}`,
        method: 'PATCH',
        onSuccess: () => {
            toast({
                title: "Tarea actualizada",
                description: `La tarea ha sido marcada como ${status}`,
                variant: "success"
            });
            onUpdate?.();
            onOpenChange(false);
        },
        onError: (errorMsg) => {
            toast({
                title: "Error",
                description: errorMsg || "No se pudo actualizar la tarea",
                variant: "destructive"
            });
        }
    });

    const handleUpdate = (customStatus?: WorkflowTask['status']) => {
        const finalStatus = customStatus || status;
        if (!finalStatus) return;

        // Merge metadata updates
        const metadataUpdate = {
            ...(task.metadata || {}),
            workshop_validation: checklistStatus
        };

        mutate({
            status: finalStatus,
            notes,
            metadata: metadataUpdate
        });
    };

    const handleAcceptAI = () => {
        const proposal = task.metadata?.llmProposal;
        if (!proposal) return;

        // Map suggested action to task status
        let targetStatus: WorkflowTask['status'] = 'COMPLETED';
        if (proposal.suggestedAction === 'REJECT') targetStatus = 'REJECTED';

        const aiNotes = `[AI Recommendation Accepted]\n\nReasoning: ${proposal.reason || 'No reasoning provided.'}\nConfidence: ${(proposal.score || 0) * 100}%\n\n${notes}`;

        mutate({ status: targetStatus, notes: aiNotes });
    };

    // Helper to access deep properties safely
    const workshopAnalysis = task.metadata?.workshop_analysis || (task as any).caseContext?.entity?.metadata?.workshop_analysis;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20">
                            {task.type}
                        </Badge>
                        <Badge variant="outline" className="opacity-70 font-mono text-[10px]">
                            {task._id?.toString()}
                        </Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold text-sidebar-foreground">
                        {task.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {task.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <Hash className="w-4 h-4 text-sidebar-primary" />
                                Contexto del Caso
                            </h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">ID Caso</span>
                                    <p className="text-sm font-semibold">{task.caseId}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Referencia</span>
                                    <p className="text-sm font-semibold flex items-center gap-1.5 text-sidebar-primary">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        Manual_V-120.pdf
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ FASE 127: AI Proposal Section */}
                        {task.metadata?.llmProposal && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-teal-800">
                                    <Brain className="w-4 h-4 text-teal-500" />
                                    Propuesta de Inteligencia Artificial
                                </h4>
                                <div className="bg-teal-50/40 p-5 rounded-2xl border-2 border-teal-100/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <Sparkles className="w-12 h-12 text-teal-600" />
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <Badge className="bg-teal-600 text-white font-black px-3 py-1">
                                            {task.metadata.llmProposal.suggestedAction === 'APPROVE' ? 'APROBAR' :
                                                task.metadata.llmProposal.suggestedAction === 'REJECT' ? 'RECHAZAR' : 'ESCALAR'}
                                        </Badge>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-teal-700 block tracking-widest">Confianza</span>
                                            <span className="text-lg font-black text-teal-900 leading-none">
                                                {Math.round((task.metadata.llmProposal.score || 0) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-700 leading-relaxed font-medium italic mb-4 bg-white/50 p-3 rounded-lg border border-teal-100">
                                        "{task.metadata.llmProposal.reason}"
                                    </p>

                                    {task.status === 'PENDING' && (
                                        <Button
                                            onClick={handleAcceptAI}
                                            disabled={isLoading}
                                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 shadow-lg shadow-teal-600/20"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Aceptar Recomendación de la IA
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Checklist Integration */}
                        {task.metadata?.checklistConfigId && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {t('checklist.validation_required')}
                                </h4>
                                <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                                    <p className="text-xs text-slate-600 mb-4">
                                        {t('checklist.validation_desc')}
                                    </p>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="w-full justify-start text-xs border-emerald-200 hover:bg-emerald-50"
                                        >
                                            <Link href={`/admin/checklist-configs/${task.metadata.checklistConfigId}`}>
                                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                {t('checklist.configure_btn')}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ⚡ FASE 128.3: Workshop Dynamic Checklist */}
                        {workshopAnalysis && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-orange-800">
                                    <Wrench className="w-4 h-4 text-orange-600" />
                                    {t('checklist.technical_spec')}
                                </h4>
                                <WorkshopChecklist
                                    analysis={workshopAnalysis}
                                    checkedItems={checklistStatus}
                                    onCheckChange={setChecklistStatus}
                                    readOnly={task.status === 'COMPLETED' || task.status === 'REJECTED'}
                                />
                            </div>
                        )}

                        {/* ⚡ FASE 165.5: LLM Fallback Context Section */}
                        {task.metadata?.source === 'LLM_FALLBACK' && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-red-800">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    Fallo en Análisis de IA (Fallback)
                                </h4>
                                <div className="bg-red-50/40 p-5 rounded-2xl border-2 border-red-100/50 shadow-sm">
                                    <p className="text-xs text-red-700 font-medium mb-2">
                                        El motor de IA no pudo completar la decisión automática. Se requiere intervención humana para validar este paso.
                                    </p>
                                    <div className="bg-white/80 p-3 rounded-lg border border-red-100 font-mono text-[10px] text-red-600">
                                        <strong>Error original:</strong> {task.metadata.error || 'Desconocido'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="notes" className="text-sm font-bold text-slate-800">Notas de Resolución</Label>
                                <span className="text-[10px] text-muted-foreground italic">Requerido para auditoría</span>
                            </div>
                            <Textarea
                                id="notes"
                                placeholder="Indica el resultado de la validación o motivos del cambio de estado..."
                                className="min-h-[120px] bg-white border-slate-200 focus:ring-sidebar-primary/20 text-sm"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-sidebar-primary/5 border border-sidebar-primary/10 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-sidebar-primary">Gestión de Estado</h4>

                            <div className="space-y-2">
                                {[
                                    { value: 'PENDING', label: 'Pendiente', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200', icon: Clock },
                                    { value: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200', icon: AlertTriangle },
                                    { value: 'COMPLETED', label: 'Completar', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200', icon: CheckCircle2 },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value as any)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-2",
                                            status === opt.value
                                                ? cn(opt.color, "border-current ring-2 ring-sidebar-primary/10 ring-offset-1")
                                                : "bg-white border-transparent text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <opt.icon className="w-4 h-4" />
                                            {opt.label}
                                        </div>
                                        {status === opt.value && <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                <User className="w-3.5 h-3.5" />
                                Asignado a: {task.assignedRole}
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-[10px] h-7 font-bold uppercase tracking-wider" asChild>
                                <Link href={`/admin/cases/${task.caseId}`}>
                                    <ExternalLink className="w-3 h-3 mr-1.5" /> Ver Expediente
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-xs font-bold">
                        Cerrar
                    </Button>
                    <Button
                        onClick={() => handleUpdate()}
                        disabled={isLoading || (status === task.status && !notes)}
                        className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white text-xs font-bold px-8"
                    >
                        {isLoading ? "Actualizando..." : "Confirmar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
