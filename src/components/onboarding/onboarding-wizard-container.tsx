"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore, OnboardingStep } from "@/store/onboarding-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Step Component Imports (To be created)
import { IdentityStep } from "./steps/identity-step";
import { TeamStep } from "./steps/team-step";
import { DocumentsStep } from "./steps/documents-step";
import { SummaryStep } from "./steps/summary-step";

const stepMap: Record<OnboardingStep, { title: string; subtitle: string; progress: number }> = {
  identity: { title: "Identidad del Tenant", subtitle: "Configura el nombre y la industria de tu organización.", progress: 25 },
  team: { title: "Invita a tu Equipo", subtitle: "Añade colaboradores para empezar a trabajar juntos.", progress: 50 },
  documents: { title: "Documentos Iniciales", subtitle: "Sube los primeros archivos para entrenar a tu RAG.", progress: 75 },
  complete: { title: "¡Todo Listo!", subtitle: "Tu entorno está configurado y listo para despegar.", progress: 100 },
};

export function OnboardingWizardContainer() {
  const { currentStep, setStep, isCompleted } = useOnboardingStore();
  const currentMetadata = stepMap[currentStep];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "identity": return <IdentityStep />;
      case "team": return <TeamStep />;
      case "documents": return <DocumentsStep />;
      case "complete": return <SummaryStep />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Progress */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          Configuración Inicial
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          {currentMetadata.title}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {currentMetadata.subtitle}
        </p>
        
        <div className="pt-4 max-w-xs mx-auto">
          <Progress value={currentMetadata.progress} className="h-1.5" />
          <div className="mt-2 flex justify-between text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">
            <span>Inicio</span>
            <span>{currentMetadata.progress}% Completado</span>
            <span>Final</span>
          </div>
        </div>
      </div>

      {/* Main Wizard Card */}
      <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-8 lg:p-12"
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Footer Navigation (Optional, or handled within steps) */}
      <div className="flex justify-center items-center gap-8 text-muted-foreground/30">
        <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", currentStep === 'identity' ? "bg-primary animate-pulse w-6" : "bg-muted")} />
            <div className={cn("w-2 h-2 rounded-full", currentStep === 'team' ? "bg-primary animate-pulse w-6" : "bg-muted")} />
            <div className={cn("w-2 h-2 rounded-full", currentStep === 'documents' ? "bg-primary animate-pulse w-6" : "bg-muted")} />
            <div className={cn("w-2 h-2 rounded-full", currentStep === 'complete' ? "bg-primary animate-pulse w-6" : "bg-muted")} />
        </div>
      </div>
    </div>
  );
}
