"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X, Mail, ChevronRight, ChevronLeft, Users } from "lucide-react";

export function TeamStep() {
  const { data, addTeamInvite, removeTeamInvite, setStep } = useOnboardingStore();
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (email && /^\S+@\S+\.\S+$/.test(email) && !data.teamInvites.includes(email)) {
      addTeamInvite(email);
      setEmail("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
        <Users className="h-6 w-6 text-orange-500 mt-1" />
        <div>
          <h3 className="font-bold text-orange-500/90">Construye tu equipo</h3>
          <p className="text-sm text-muted-foreground">
            Invita a otros administradores o técnicos para colaborar en la gestión de tus sistemas de elevación.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Correo electrónico del invitado
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              placeholder="ejemplo@empresa.com"
              className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} variant="secondary" className="h-12 rounded-xl px-6 gap-2">
            <UserPlus className="h-4 w-4" />
            Añadir
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 min-h-[48px] p-2 rounded-xl border border-dashed border-border/50">
          {data.teamInvites.length === 0 ? (
            <span className="text-xs text-muted-foreground/50 flex items-center px-2">No hay invitados todavía...</span>
          ) : (
            data.teamInvites.map((invite) => (
              <Badge key={invite} className="h-8 pl-3 pr-1 text-sm bg-primary/10 text-primary border-primary/20 gap-2">
                {invite}
                <button
                  onClick={() => removeTeamInvite(invite)}
                  className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="pt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep("identity")} className="rounded-xl h-12 gap-2">
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          size="lg"
          onClick={() => setStep("documents")}
          className="rounded-xl px-8 h-12 gap-2 group"
        >
          Siguiente paso
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
