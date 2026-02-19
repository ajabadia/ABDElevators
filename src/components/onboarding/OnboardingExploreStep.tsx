"use client";

import React from "react";
import { FileBarChart, Search, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { WorkContext } from "@/lib/work-context";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ACTIONS: Record<WorkContext, { icon: any; label: string; href: string; color: string }[]> = {
    inspection: [
        { icon: FileBarChart, label: "Generar Informe de Inspección", href: "/admin/reports", color: "text-emerald-500 bg-emerald-500/10" },
        { icon: Search, label: "Buscar Normativas", href: "/search", color: "text-blue-500 bg-blue-500/10" },
    ],
    maintenance: [
        { icon: Search, label: "Consultar Manuales", href: "/search", color: "text-blue-500 bg-blue-500/10" },
        { icon: Settings, label: "Configurar Notificaciones", href: "/admin/settings", color: "text-purple-500 bg-purple-500/10" },
    ],
    engineering: [
        { icon: Search, label: "Análisis de Diseños", href: "/search", color: "text-amber-500 bg-amber-500/10" },
        { icon: FileBarChart, label: "Métricas de Calidad", href: "/admin/reports", color: "text-emerald-500 bg-emerald-500/10" },
    ],
    admin: [
        { icon: Settings, label: "Panel de Administración", href: "/admin", color: "text-purple-500 bg-purple-500/10" },
        { icon: FileBarChart, label: "Observabilidad RAG", href: "/admin/reports", color: "text-emerald-500 bg-emerald-500/10" },
    ]
};

export function OnboardingExploreStep() {
    const { userContext, skipOnboarding } = useOnboardingContext();
    const actions = ACTIONS[userContext as WorkContext] || ACTIONS.inspection;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
                {actions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        onClick={skipOnboarding}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border border-border bg-secondary/5",
                            "hover:bg-secondary/10 hover:border-primary/30 transition-all group"
                        )}
                    >
                        <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform", action.color)}>
                            <action.icon size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{action.label}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                ))}
            </div>

            <div className="pt-2">
                <Button
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={skipOnboarding}
                >
                    Explorar el panel principal
                </Button>
            </div>
        </div>
    );
}
