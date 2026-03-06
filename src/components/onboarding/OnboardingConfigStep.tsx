"use client";

import React, { useState } from "react";
import { Users, ShieldCheck, Scale, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COMPANY_SIZES = [
    { id: "1-10", label: "Pequeña (1-10 usuarios)", icon: Users },
    { id: "11-50", label: "Mediana (11-50 usuarios)", icon: Users },
    { id: "51+", label: "Enterprise (51+ usuarios)", icon: Users }
];

export function OnboardingConfigStep() {
    const { nextStep } = useOnboardingContext();
    const [size, setSize] = useState<string | null>(null);
    const [gdpr, setGdpr] = useState(true);

    const handleContinue = () => {
        if (!size) return;
        nextStep();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Scale size={14} className="text-primary" />
                    Escalabilidad
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {COMPANY_SIZES.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSize(opt.id)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                size === opt.id
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                    : "border-border bg-card hover:border-primary/30"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    size === opt.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                                )}>
                                    <opt.icon size={16} />
                                </div>
                                <span className="font-bold text-sm">{opt.label}</span>
                            </div>
                            {size === opt.id && <Check size={16} className="text-primary" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <ShieldCheck size={14} className="text-primary" />
                        Privacidad & Cumplimiento
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0">
                        RECOMENDADO
                    </Badge>
                </div>

                <div className={cn(
                    "p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer",
                    gdpr ? "border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5" : "border-border bg-card"
                )} onClick={() => setGdpr(!gdpr)}>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        gdpr ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
                    )}>
                        <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-sm">Modo Máxima Privacidad (GDPR)</h4>
                            <div className={cn(
                                "w-10 h-5 rounded-full relative transition-colors",
                                gdpr ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                            )}>
                                <div className={cn(
                                    "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                    gdpr ? "left-5.5" : "left-0.5"
                                )} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Activa el enmascaramiento automático de PII (Datos de Identificación Personal) en todos los procesos de IA.
                        </p>
                    </div>
                </div>
            </div>

            <Button
                className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                onClick={handleContinue}
                disabled={!size}
            >
                Continuar
                <Check className="ml-2 h-4 w-4" />
            </Button>

            <p className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground text-center">
                <Info size={12} />
                Podrás cambiar estos ajustes más tarde en el Centro de Comando.
            </p>
        </div>
    );
}
