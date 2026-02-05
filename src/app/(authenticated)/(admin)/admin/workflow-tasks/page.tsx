"use client";

import React from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { WorkflowTaskInbox } from '@/components/admin/WorkflowTaskInbox';
import {
    CheckSquare,
    ShieldCheck,
    Users,
    History
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function WorkflowTasksPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Task Collaboration Hub"
                highlight="Workflow Goverance"
                subtitle="Gestión y validación de tareas críticas automatizadas por el motor industrial."
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 mb-8">
                <StatSimple
                    title="Pendientes"
                    value="12"
                    icon={CheckSquare}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <StatSimple
                    title="En Revisión"
                    value="5"
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatSimple
                    title="Completadas hoy"
                    value="28"
                    icon={ShieldCheck}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatSimple
                    title="Tiempo medio"
                    value="45m"
                    icon={History}
                    color="text-sidebar-primary"
                    bg="bg-sidebar-primary/5"
                />
            </div>

            <WorkflowTaskInbox />
        </PageContainer>
    );
}

function StatSimple({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-slate-100 shadow-sm overflow-hidden group">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110", bg)}>
                    <Icon className={cn("w-5 h-5", color)} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold text-slate-800">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
