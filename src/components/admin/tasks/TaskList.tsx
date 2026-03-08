"use client";

import { WorkflowTask } from "@abd/workflow-engine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface TaskListProps {
    tasks: WorkflowTask[];
}

const PRIORITY_COLORS = {
    LOW: "bg-slate-100 text-slate-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
};

export function TaskList({ tasks }: TaskListProps) {
    const t = useTranslations('tasks');
    const router = useRouter();

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('table.title')}</TableHead>
                        <TableHead>{t('table.status')}</TableHead>
                        <TableHead>{t('table.priority')}</TableHead>
                        <TableHead>{t('table.createdAt')}</TableHead>
                        <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task._id?.toString()}>
                            <TableCell className="font-medium max-w-[300px] truncate" title={task.title}>
                                <div className="flex flex-col">
                                    <span>{task.title}</span>
                                    <span className="text-xs text-muted-foreground truncate">{task.description}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{t(`status.${task.status.toLowerCase()}` as any) || task.status}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={PRIORITY_COLORS[task.priority]}>
                                    {task.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(task.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell className="text-right">
                                {task.caseId && (
                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/cases/${task.caseId}`)}>
                                        {t('viewCase')} <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {tasks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                {t('empty')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
