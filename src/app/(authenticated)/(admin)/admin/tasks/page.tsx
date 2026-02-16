import { TasksView } from "@/components/admin/tasks/TasksView";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MyTasksPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Mis Tareas"
                subtitle="Gestión centralizada de tareas y flujos de trabajo pendientes."
                actions={
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                }
            />
            <TasksView />
        </PageContainer>
    );
}
