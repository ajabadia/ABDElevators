"use client";

import React, { useState } from 'react';
import { useApiList } from '@/hooks/useApiList';
import { WorkflowTask } from '@/lib/schemas';
import { WorkflowTaskCard } from './WorkflowTaskCard';
import { ContentCard } from '@/components/ui/content-card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    Filter,
    LayoutGrid,
    Inbox,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkflowTaskInbox() {
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: tasks, isLoading, refresh } = useApiList<WorkflowTask>({
        endpoint: '/api/admin/workflow-tasks',
        filters: {
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            q: searchQuery
        }
    });

    const isPending = statusFilter === 'PENDING';
    const isCompleted = statusFilter === 'COMPLETED';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                    <TabsList className="bg-slate-100/50 p-1 border border-slate-200/60">
                        <TabsTrigger value="PENDING" className="gap-2 text-[11px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-sidebar-primary data-[state=active]:shadow-sm px-4">
                            <Clock className="w-3.5 h-3.5" /> Pendientes
                        </TabsTrigger>
                        <TabsTrigger value="IN_PROGRESS" className="gap-2 text-[11px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-sidebar-primary data-[state=active]:shadow-sm px-4">
                            <Inbox className="w-3.5 h-3.5" /> En Curso
                        </TabsTrigger>
                        <TabsTrigger value="COMPLETED" className="gap-2 text-[11px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-sidebar-primary data-[state=active]:shadow-sm px-4">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completadas
                        </TabsTrigger>
                        <TabsTrigger value="ALL" className="gap-2 text-[11px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-sidebar-primary data-[state=active]:shadow-sm px-4">
                            <LayoutGrid className="w-3.5 h-3.5" /> Todas
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por caso o título..."
                        className="pl-9 h-10 bg-white border-slate-200 text-sm focus:ring-sidebar-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                    <Loader2 className="w-8 h-8 text-sidebar-primary animate-spin mb-4" />
                    <p className="text-sm font-medium text-slate-500">Sincronizando tareas del tenant...</p>
                </div>
            ) : tasks && tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                        <WorkflowTaskCard
                            key={task._id.toString()}
                            task={task}
                            onUpdate={refresh}
                        />
                    ))}
                </div>
            ) : (
                <div className="h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60 p-12 text-center group">
                    <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-sidebar-primary/30 transition-all duration-500 shadow-sm">
                        <Inbox className="w-10 h-10 text-slate-300 group-hover:text-sidebar-primary/40 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron tareas</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        No hay tareas que coincidan con los filtros actuales. Todas las validaciones de cumplimiento están al día.
                    </p>
                </div>
            )}
        </div>
    );
}
