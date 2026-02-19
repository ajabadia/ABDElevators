"use client";

import { WorkflowTask } from "@abd/workflow-engine";
import { TaskCard } from "./TaskCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskBoardProps {
    tasks: WorkflowTask[];
}

const COLUMNS = [
    { id: "PENDING", title: "Pendiente", color: "bg-gray-50 border-gray-200" },
    { id: "IN_PROGRESS", title: "En Progreso", color: "bg-blue-50 border-blue-200" },
    { id: "COMPLETED", title: "Completado", color: "bg-green-50 border-green-200" },
    { id: "REJECTED", title: "Rechazado/Descartado", color: "bg-red-50 border-red-200" },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status);
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
                <div key={col.id} className={`flex-shrink-0 w-80 flex flex-col rounded-lg border ${col.color} h-full max-h-[calc(100vh-220px)]`}>
                    <div className="p-3 font-semibold text-sm flex justify-between items-center bg-white/50 border-b border-inherit rounded-t-lg">
                        {col.title}
                        <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-inherit">
                            {getTasksByStatus(col.id).length}
                        </span>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                            {getTasksByStatus(col.id).map((task) => (
                                <TaskCard key={task._id?.toString()} task={task} />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            ))}
        </div>
    );
}
