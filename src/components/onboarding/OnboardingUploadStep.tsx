"use client";

import React, { useCallback } from "react";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function OnboardingUploadStep() {
    const { nextStep } = useOnboardingContext();
    const [isProcessingDemo, setIsProcessingDemo] = React.useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            toast.success("Documento recibido. Procesando...");
            // In a real app, we would upload here. 
            // For onboarding simulation, we'll just advance.
            setTimeout(() => nextStep(), 1500);
        }
    }, [nextStep]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false
    });

    const handleUseDemo = async () => {
        setIsProcessingDemo(true);
        try {
            // Simulated delay for "loading" demo data
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success("Documento demo cargado: Real Decreto 355/2024 (ITC AEM 1)");
            nextStep();
        } catch (error) {
            toast.error("Error al cargar demo");
        } finally {
            setIsProcessingDemo(false);
        }
    };

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer",
                    isDragActive
                        ? "border-primary bg-primary/5 scale-[0.98] shadow-inner"
                        : "border-border hover:border-primary/50 hover:bg-secondary/5",
                )}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                        Arrastra tu documento o haz click aquí
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                        PDF • MÁX 50MB
                    </p>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-card px-2 text-muted-foreground">O también</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-primary/20 hover:border-primary/50 hover:bg-primary/5 group transition-all"
                onClick={handleUseDemo}
                disabled={isProcessingDemo}
            >
                {isProcessingDemo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-primary group-hover:animate-pulse" />
                )}
                <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">Usar documento de ejemplo</span>
                    <span className="text-[10px] opacity-60 font-normal">Real Decreto 355/2024 (ITC AEM 1)</span>
                </div>
            </Button>
        </div>
    );
}
