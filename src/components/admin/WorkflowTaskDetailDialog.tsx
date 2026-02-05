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
    CheckCircle2,
    AlertTriangle,
    Clock,
    User,
    Hash,
    Paperclip,
    ExternalLink
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface WorkflowTaskDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: WorkflowTask;
    onUpdate?: () => void;
}

export function WorkflowTaskDetailDialog({ open, onOpenChange, task, onUpdate }: WorkflowTaskDetailDialogProps) {
    const { toast } = useToast();
    const { data: session } = useSession();
    const [status, setStatus] = useState<WorkflowTask['status']>(task.status);
    const [notes, setNotes] = useState('');

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

    const handleUpdate = () => {
        if (!status) return;
        mutate({ status, notes });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20">
                            {task.type}
                        </Badge>
                        <Badge variant="outline" className="opacity-70 font-mono text-[10px]">
                            {task._id.toString()}
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

                            {/* Dynamic Checklist Integration */}
                            {task.metadata?.checklistConfigId && (
                                <div className="space-y-4 mt-6">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Checklist de Validación Requerido
                                    </h4>
                                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                                        <p className="text-xs text-slate-600 mb-4">
                                            Este workflow requiere la validación de los siguientes puntos técnicos:
                                        </p>
                                        <div className="space-y-2">
                                            {/* Link to formal checklist execution or embedded preview */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="w-full justify-start text-xs border-emerald-200 hover:bg-emerald-50"
                                            >
                                                <Link href={`/admin/checklist-configs/${task.metadata.checklistConfigId}`}>
                                                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                    Ver / Configurar Protocolo de Validación
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
                            <Button variant="outline" size="sm" className="w-full text-[10px] h-7 font-bold uppercase tracking-wider">
                                <ExternalLink className="w-3 h-3 mr-1.5" /> Ver Expediente
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-xs font-bold">
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleUpdate}
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
