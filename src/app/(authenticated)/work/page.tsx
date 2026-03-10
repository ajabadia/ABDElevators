"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ClipboardCheck, ListTodo, Gavel, Hammer, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const WORK_MODULES = [
    {
        id: "orders",
        titleKey: "work.orders.title",
        descKey: "work.orders.description",
        icon: Briefcase,
        href: "/work/orders",
        color: "text-blue-600",
        bg: "bg-blue-600/10",
    },
    {
        id: "tasks",
        titleKey: "work.tasks.title",
        descKey: "work.tasks.description",
        icon: ListTodo,
        href: "/work/tasks_legacy",
        color: "text-amber-600",
        bg: "bg-amber-600/10",
    },
    {
        id: "checklists",
        titleKey: "work.checklists.title",
        descKey: "work.checklists.description",
        icon: ClipboardCheck,
        href: "/work/checklists",
        color: "text-emerald-600",
        bg: "bg-emerald-600/10",
    },
    {
        id: "cases",
        titleKey: "work.cases.title",
        descKey: "work.cases.description",
        icon: Gavel,
        href: "/work/cases",
        color: "text-purple-600",
        bg: "bg-purple-600/10",
    },
    {
        id: "workshop",
        titleKey: "work.workshop.title",
        descKey: "work.workshop.description",
        icon: Hammer,
        href: "/work/workshop",
        color: "text-rose-600",
        bg: "bg-rose-600/10",
    },
];

export default function WorkHub() {
    const t = useTranslations();

    const safeT = (key: string, fallback: string) => {
        try {
            const res = t(key);
            return res === key ? fallback : res;
        } catch {
            return fallback;
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <LayoutGrid className="h-10 w-10 text-primary" />
                    {safeT("work.hub.title", "Work Center")}
                </h1>
                <p className="text-muted-foreground text-lg italic max-w-2xl">
                    {safeT("work.hub.subtitle", "Manage orders, track tasks, and execute checklists across your operational workflows.")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {WORK_MODULES.map((module) => (
                    <Link key={module.id} href={module.href}>
                        <Card className="h-full border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer bg-card/40 backdrop-blur-md border-r-4 border-r-transparent group-hover:border-r-primary">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`${module.bg} p-3 rounded-xl group-hover:rotate-6 transition-transform duration-300`}>
                                    <module.icon className={`h-6 w-6 ${module.color}`} />
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                    {safeT(module.titleKey, module.id.charAt(0).toUpperCase() + module.id.slice(1))}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed text-muted-foreground/80">
                                    {safeT(module.descKey, "Access and manage " + module.id + " in your workspace.")}
                                </CardDescription>
                                <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                                    Open Module →
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
