"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowTask } from "@abd/workflow-engine";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskCardProps {
    task: WorkflowTask;
    onStatusChange?: (id: string, newStatus: string) => void;
}

const PRIORITY_COLORS = {
    LOW: "bg-slate-100 text-slate-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
};

const STATUS_ICONS = {
    PENDING: Clock,
    IN_PROGRESS: AlertCircle,
    COMPLETED: CheckCircle2,
    REJECTED: AlertCircle,
};

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleAction = () => {
        if (task.caseId) {
            router.push(`/admin/cases/${task.caseId}`);
        }
    };

    const Icon = STATUS_ICONS[task.status as keyof typeof STATUS_ICONS] || Clock;

    return (
        <Card className="w-full hover:shadow-md transition-shadow cursor-pointer border-l-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || "bg-gray-100"}>
                        {task.priority}
                    </Badge>
                    {task.type && <Badge variant="secondary" className="text-xs">{task.type}</Badge>}
                </div>
                <CardTitle className="text-sm font-medium mt-2 line-clamp-2">
                    {task.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
                <p className="text-xs text-muted-foreground line-clamp-3">
                    {task.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Icon className="w-3 h-3" />
                    <span>{format(new Date(task.createdAt), "dd MMM yyyy", { locale: es })}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleAction} className="text-xs h-7">
                    Ver Caso <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
