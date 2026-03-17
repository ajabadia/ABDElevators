"use client";

import React from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndustryType } from "@/lib/schemas";
import { Building2, ChevronRight, Briefcase, ShieldCheck, Factory, Gavel } from "lucide-react";

export function IdentityStep() {
  const { data, updateData, setStep } = useOnboardingStore();

  const handleNext = () => {
    if (data.name && data.industry) {
      setStep("team");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="orgName" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Nombre de la Organización
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              id="orgName"
              placeholder="Ej. ABDElevators S.A."
              className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-lg"
              value={data.name || ""}
              onChange={(e) => updateData({ name: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Este nombre se usará en tus reportes y comunicaciones oficiales.
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Logotipo de la Empresa
          </Label>
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-muted/20 border border-dashed border-border group hover:border-primary/50 transition-all">
            <div className="h-24 w-24 rounded-2xl bg-background flex items-center justify-center border border-border shadow-inner relative overflow-hidden">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo" className="object-contain p-2 h-full w-full" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => updateData({ logoUrl: 'https://placehold.co/400x400/0ea5e9/ffffff?text=LOGO' })} className="rounded-lg">
                  Subir Logo
                </Button>
                {data.logoUrl && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Analizando Marca...</span>
                    </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Recomendado: SVG o PNG (256x256)</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Sector Industrial
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'ELEVATORS', label: 'Ascensores & Elevación', icon: Factory },
              { id: 'LEGAL', label: 'Legal & Contratos', icon: Gavel },
              { id: 'BANKING', label: 'Banca & Finanzas', icon: ShieldCheck },
              { id: 'GENERIC', label: 'Servicios Generales', icon: Briefcase },
            ].map((industry) => (
              <button
                key={industry.id}
                onClick={() => updateData({ industry: industry.id })}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  data.industry === industry.id
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-border/30 hover:border-border/60 hover:bg-muted/30"
                }`}
              >
                <div className={`p-3 rounded-xl ${data.industry === industry.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <industry.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-sm">{industry.label}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Preset Optimizado</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <Button
          size="lg"
          disabled={!data.name || !data.industry}
          onClick={handleNext}
          className="rounded-xl px-8 h-12 gap-2 group"
        >
          Continuar
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
