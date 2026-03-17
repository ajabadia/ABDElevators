"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocumentsStep() {
  const { setStep } = useOnboardingStore();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulation: In a real app we would use IngestService
    setFiles([{ name: "Especificaciones_Manual.pdf", size: "2.4 MB" }]);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">
          Entrenamiento RAG Inicial
        </h3>
        <p className="text-xs text-muted-foreground text-center italic">
          Sube tus manuales técnicos o especificaciones para empezar a consultar con la IA.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-[32px] p-12 transition-all duration-500 overflow-hidden",
          isDragging 
            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
            : "border-border/30 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className={cn(
            "p-6 rounded-full transition-all duration-500",
            files.length > 0 ? "bg-green-500 text-white" : "bg-primary/10 text-primary group-hover:scale-110"
          )}>
            {files.length > 0 ? <CheckCircle2 className="h-10 w-10" /> : <UploadCloud className="h-10 w-10" />}
          </div>
          
          <div>
            <div className="text-xl font-bold tracking-tight">
              {files.length > 0 ? "¡Documentos Recibidos!" : "Arrastra tus documentos aquí"}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Formatos aceptados: PDF, DOCX, TXT (Max 50MB)
            </p>
          </div>

          <Button variant="outline" className="rounded-full px-8 bg-transparent border-primary/20 hover:bg-primary/10">
            Seleccionar archivos
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileUp className="h-40 w-40" />
        </div>
      </div>

      {files.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/30">
              <div className="p-3 rounded-xl bg-background">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{f.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{f.size}</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          ))}
        </div>
      )}

      <div className="pt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep("team")} className="rounded-xl h-12 gap-2">
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          size="lg"
          onClick={() => setStep("complete")}
          className="rounded-xl px-8 h-12 gap-2 group"
        >
          Finalizar configuración
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
