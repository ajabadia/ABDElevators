"use client";

import { useTranslations } from 'next-intl';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { ListCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TasksView } from '@/components/admin/tasks/TasksView';
import { useGuardian } from '@/hooks/use-guardian';
import { use } from 'react';

export default function UserTasksPage() {
    const t = useTranslations('work');
    const tCommon = useTranslations('common');
    const { can } = useGuardian();

    // Permission sync for the New button
    const canCreate = use(can('workflow:task', 'create'));

    return (
        <FeatureShell
            title={tCommon("navigation.nav.work.tasks")}
            subtitle={t("tasks.description")}
            icon={<ListCheck className="w-6 h-6 text-primary" />}
            backHref="/work"
            actions={
                <Button
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white"
                    disabled={!canCreate}
                    title={!canCreate ? "No tienes permisos para crear tareas" : ""}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {tCommon("actions.new")}
                </Button>
            }
        >
            <div className="mt-6">
                <TasksView />
            </div>
        </FeatureShell>
    );
}
