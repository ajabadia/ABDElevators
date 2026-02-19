"use client";

import React from "react";
import { Wrench, ShieldCheck, Component, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkContext } from "@/lib/work-context";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { cn } from "@/lib/utils";

const ROLES: { id: WorkContext; icon: any; title: string; description: string; color: string }[] = [
    {
        id: "maintenance",
        icon: Wrench,
        title: "Técnico Mantenimiento",
        description: "Encuentra diagramas, errores comunes y guías de ajuste rápido.",
        color: "text-blue-500 bg-blue-500/10"
    },
    {
        id: "inspection",
        icon: ShieldCheck,
        title: "Calidad e Inspección",
        description: "Valida normativas EN 81-20/50 y genera informes técnicos.",
        color: "text-emerald-500 bg-emerald-500/10"
    },
    {
        id: "engineering",
        icon: Component,
        title: "Ingeniería y Diseño",
        description: "Cálculos estructurales, tráfico y especificaciones de componentes.",
        color: "text-amber-500 bg-amber-500/10"
    },
    {
        id: "admin",
        icon: ShieldAlert,
        title: "IT / Administrador",
        description: "Configuración de RAG, gestión de usuarios y observabilidad.",
        color: "text-purple-500 bg-purple-500/10"
    }
];

export function OnboardingWelcomeStep() {
    const { setUserContext } = useOnboardingContext();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROLES.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => setUserContext(role.id)}
                        className={cn(
                            "group flex flex-col items-start p-4 rounded-2xl border border-border bg-card",
                            "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
                        )}
                    >
                        <div className={cn("p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-transform", role.color)}>
                            <role.icon size={20} />
                        </div>
                        <h4 className="font-bold text-sm text-foreground mb-1">
                            {role.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {role.description}
                        </p>
                    </button>
                ))}
            </div>

            <div className="pt-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                    Selecciona uno para personalizar tu experiencia
                </p>
            </div>
        </div>
    );
}
