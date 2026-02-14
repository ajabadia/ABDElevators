"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    PauseCircle,
    Shield,
    Calendar,
    ArrowRight,
    Brain
} from 'lucide-react';
import { WorkflowTask } from '@/lib/schemas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkflowTaskDetailDialog } from './WorkflowTaskDetailDialog';

interface WorkflowTaskCardProps {
    task: WorkflowTask;
    onUpdate?: () => void;
}

const statusConfig = {
    PENDING: {
        label: "Pendiente",
        icon: Clock,
        variant: "outline" as const,
        className: "bg-amber-50 text-amber-700 border-amber-200"
    },
    IN_PROGRESS: {
        label: "En Progreso",
        icon: PauseCircle,
        variant: "secondary" as const,
        className: "bg-blue-50 text-blue-700 border-blue-200"
    },
    COMPLETED: {
        label: "Completada",
        icon: CheckCircle2,
        variant: "default" as const,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    REJECTED: {
        label: "Rechazada",
        icon: AlertCircle,
        variant: "destructive" as const,
        className: "bg-red-50 text-red-700 border-red-200"
    },
    CANCELLED: {
        label: "Cancelada",
        icon: AlertCircle,
        variant: "destructive" as const,
        className: "bg-slate-50 text-slate-700 border-slate-200"
    }
};

const priorityConfig = {
    LOW: "bg-slate-100 text-slate-700",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-amber-100 text-amber-700",
    CRITICAL: "bg-red-100 text-red-700",
    URGENT: "bg-red-100 text-red-700"
};

export function WorkflowTaskCard({ task, onUpdate }: WorkflowTaskCardProps) {
    const [showDetail, setShowDetail] = useState(false);
    const StatusIcon = statusConfig[task.status].icon;
    const isCompleted = task.status === 'COMPLETED';

    return (
        <>
            <Card className={cn(
                "group hover:border-sidebar-primary/30 transition-all duration-300 shadow-sm overflow-hidden border-sidebar-border",
                isCompleted && "bg-slate-50/50 grayscale-[0.3]"
            )}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-sidebar-foreground">
                                <StatusIcon className={cn("w-4 h-4", task.status === 'PENDING' ? "text-amber-500" : "text-sidebar-primary")} />
                                {task.title}
                            </CardTitle>
                            {task.metadata?.llmProposal && (
                                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-[9px] h-4 gap-1 px-1.5 flex w-fit items-center">
                                    <Brain className="w-2.5 h-2.5" />
                                    AI SUGGESTION
                                </Badge>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider h-5 px-1.5 shrink-0", priorityConfig[task.priority])}>
                            {task.priority}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Shield className="w-3.5 h-3.5" />
                            <span>{task.assignedRole}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(new Date(task.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-3 pt-0 flex justify-between items-center bg-slate-50/30 border-t border-slate-100/50 mt-auto">
                    <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-sidebar-primary/20 flex items-center justify-center border-2 border-white ring-1 ring-slate-100">
                            <span className="text-[10px] font-bold text-sidebar-primary">C</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetail(true)}
                        className="h-8 text-[11px] font-semibold hover:bg-sidebar-primary/10 hover:text-sidebar-primary group/btn"
                    >
                        Gestionar <ArrowRight className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </CardFooter>
            </Card>

            <WorkflowTaskDetailDialog
                open={showDetail}
                onOpenChange={setShowDetail}
                task={task}
                onUpdate={onUpdate}
            />
        </>
    );
}
