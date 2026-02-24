"use client";

import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { ListCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TasksView } from '@/components/admin/tasks/TasksView';
import { useGuardian } from '@/hooks/use-guardian';
import { useState, useEffect } from 'react';

export default function UserTasksPage() {
    const t = useTranslations('knowledge_hub'); // Using existing keys for now
    const { can } = useGuardian();
    const [canCreate, setCanCreate] = useState(false);

    useEffect(() => {
        can('workflow:task', 'create').then(setCanCreate);
    }, [can]);


    return (
        <PageContainer>
            <PageHeader
                title="Mis Tareas"
                subtitle="Gestión de flujos de trabajo y actividades pendientes."
                icon={<ListCheck className="w-6 h-6 text-primary" />}
                actions={
                    <Button
                        className="rounded-xl"
                        disabled={!canCreate}
                        title={!canCreate ? "No tienes permisos para crear tareas" : ""}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                }
            />
            <div className="mt-6">
                <TasksView />
            </div>
        </PageContainer>
    );
}
