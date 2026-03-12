"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { getCsrfToken } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileStore } from "@/store/profile-store";

export function TechnicianPinForm() {
    const { fetchProfile } = useProfileStore();
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const pin = formData.get("pin") as string;
        const confirmPin = formData.get("confirmPin") as string;

        // Validaciones básicas
        if (pin !== confirmPin) {
            toast.error("Los PINs no coinciden");
            setLoading(false);
            return;
        }

        if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
            toast.error("El PIN debe tener entre 4 y 6 dígitos numéricos");
            setLoading(false);
            return;
        }

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/user/profile/pin", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken || ""
                },
                body: JSON.stringify({ pin }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al actualizar el PIN");
            }

            toast.success("PIN de técnico actualizado correctamente");
            (e.target as HTMLFormElement).reset();
            fetchProfile();
        } catch (error: any) {
            toast.error(error.message || "Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-200 mb-4">
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
                <div className="text-xs leading-tight">
                    <span className="font-bold block mb-1 underline">Seguridad en Campo</span>
                    Este PIN será necesario para validar y cerrar partes de trabajo y checklists desde la aplicación móvil. Mantenlo privado.
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="pin" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <KeyRound className="w-3 h-3" />
                    Nuevo PIN (4-6 dígitos)
                </Label>
                <div className="relative">
                    <Input
                        id="pin"
                        name="pin"
                        type={showPin ? "text" : "password"}
                        placeholder="••••"
                        maxLength={6}
                        required
                        inputMode="numeric"
                        className="h-12 text-lg tracking-[0.5em] font-mono pr-12 rounded-xl"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Solo números. Recomendamos 4 dígitos para agilidad en campo.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPin" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar PIN</Label>
                <Input
                    id="confirmPin"
                    name="confirmPin"
                    type={showPin ? "text" : "password"}
                    placeholder="••••"
                    maxLength={6}
                    required
                    inputMode="numeric"
                    className="h-12 text-lg tracking-[0.5em] font-mono rounded-xl"
                    disabled={loading}
                />
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/10" 
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar PIN de Seguridad"}
            </Button>
        </form>
    );
}
