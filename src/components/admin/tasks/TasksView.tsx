"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkflowTask } from "@abd/workflow-engine";
import { TaskBoard } from "./TaskBoard";
import { TaskList } from "./TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, RefreshCw, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useGuardian } from "@/hooks/use-guardian";

export function TasksView() {
    const { can } = useGuardian();
    const [canCreate, setCanCreate] = useState(false);
    const [tasks, setTasks] = useState<WorkflowTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [activeTab, setActiveTab] = useState("my_tasks");
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("ALL");

    // Dynamic permission check for UI actions
    useEffect(() => {
        can('workflow:task', 'create').then(setCanCreate);
    }, [can]);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === "my_tasks" ? "/api/tasks/my" : "/api/tasks/created";
            const res = await fetch(endpoint);
            if (!res.ok) {
                const text = await res.text();
                console.error(`Error fetching tasks: ${res.status} ${res.statusText}`, text);
                throw new Error(`Error fetching tasks: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setTasks(data.data);
            }
        } catch (error) {
            toast.error("No se pudieron cargar las tareas.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase()) ||
            task.caseId?.toLowerCase().includes(search.toLowerCase());

        const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

        return matchesSearch && matchesPriority;
    });

    return (
        <div className="h-full flex flex-col space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <TabsList>
                        <TabsTrigger value="my_tasks">Mis Tareas</TabsTrigger>
                        <TabsTrigger value="created_by_me">Creadas por mí</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar tareas..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas</SelectItem>
                                <SelectItem value="CRITICAL">Crítica</SelectItem>
                                <SelectItem value="HIGH">Alta</SelectItem>
                                <SelectItem value="MEDIUM">Media</SelectItem>
                                <SelectItem value="LOW">Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchTasks()} title="Actualizar">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="bg-muted p-1 rounded-md flex">
                            <Button
                                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setViewMode("kanban")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <TabsContent value="my_tasks" className="m-0 h-full">
                    <div className="flex-1 overflow-hidden min-h-[400px]">
                        {loading && tasks.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-muted-foreground">
                                Cargando tareas...
                            </div>
                        ) : (
                            <>
                                {viewMode === "kanban" ? (
                                    <TaskBoard tasks={filteredTasks} />
                                ) : (
                                    <TaskList tasks={filteredTasks} />
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="created_by_me" className="m-0 h-full">
                    <div className="flex-1 overflow-hidden min-h-[400px]">
                        {loading && tasks.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-muted-foreground">
                                Cargando tareas...
                            </div>
                        ) : (
                            <>
                                {viewMode === "kanban" ? (
                                    <TaskBoard tasks={filteredTasks} />
                                ) : (
                                    <TaskList tasks={filteredTasks} />
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
