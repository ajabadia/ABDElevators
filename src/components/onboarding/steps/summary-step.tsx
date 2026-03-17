"use client";

import React from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Button } from "@/components/ui/button";
import { PartyPopper, LayoutDashboard, Sparkles, CheckCircle2, Rocket, Building2, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function SummaryStep() {
  const { completeOnboarding } = useOnboardingStore();

  return (
    <div className="space-y-10 text-center py-4">
      <div className="flex justify-center">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="relative"
        >
            <div className="p-8 rounded-full bg-primary/10 text-primary">
                <PartyPopper className="h-16 w-16" />
            </div>
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full"
            />
        </motion.div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight">¡Enhorabuena, comandante!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Has completado la configuración inicial. Tu entorno RAG está siendo optimizado para tu industria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Perfil Listo" },
          { icon: Users, label: "Equipo Invitado" },
          { icon: ShieldCheck, label: "Seguridad Capa 8" },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/30 border border-border/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <Link href="/work" onClick={completeOnboarding}>
          <Button size="lg" className="rounded-2xl px-12 h-14 text-lg font-bold shadow-xl shadow-primary/20 gap-3 group">
            Ir al Dashboard
            <Rocket className="h-5 w-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
      
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-30">
        Empowered by ABD RAG Platform v8.3
      </p>
    </div>
  );
}
