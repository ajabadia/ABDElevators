"use client";

import React, { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    Delete, 
    CheckCircle2, 
    ShieldCheck, 
    Loader2, 
    X,
    KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import bcrypt from "bcryptjs";
import { useProfileStore } from "@/store/profile-store";

interface TechnicianPinValidationProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    actionLabel?: string;
}

export function TechnicianPinValidation({ 
    isOpen, 
    onOpenChange, 
    onSuccess,
    actionLabel = "Validar Acción"
}: TechnicianPinValidationProps) {
    const { user } = useProfileStore();
    const [pin, setPin] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleValidate = async () => {
        if (pin.length < 4) {
            toast.error("El PIN debe tener al menos 4 dígitos");
            return;
        }

        setIsValidating(true);
        setError(false);

        try {
            // En entorno real, esto iría a una API para máxima seguridad,
            // pero permitimos validación local para modo OFFLINE (Fase 503)
            if (!user?.technicianPinHash) {
                toast.error("No has configurado un PIN de seguridad en tu perfil");
                setIsValidating(false);
                return;
            }

            const isValid = await bcrypt.compare(pin, user.technicianPinHash);

            if (isValid) {
                toast.success("Identidad validada correctamente");
                onSuccess();
                onOpenChange(false);
                setPin("");
            } else {
                setError(true);
                setPin("");
                toast.error("PIN incorrecto. Inténtalo de nuevo.");
            }
        } catch (err) {
            console.error("PIN validation error:", err);
            toast.error("Error al validar el PIN");
        } finally {
            setIsValidating(false);
        }
    };

    const numpad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[32px] border-none bg-slate-950 text-white select-none">
                <div className="p-8 space-y-6">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 mb-2">
                            <ShieldCheck size={28} />
                        </div>
                        <DialogTitle className="text-center text-xl font-black tracking-tight">{actionLabel}</DialogTitle>
                        <DialogDescription className="text-center text-slate-400 text-xs">
                            Introduce tu PIN de seguridad para confirmar esta operación en campo.
                        </DialogDescription>
                    </DialogHeader>

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-4 py-4">
                        {[...Array(user?.technicianPinHash ? (pin.length > 4 ? 6 : 4) : 4)].map((_, i) => (
                            <div 
                                key={i}
                                className={cn(
                                    "w-4 h-4 rounded-full transition-all duration-200 border-2",
                                    i < pin.length 
                                        ? "bg-teal-400 border-teal-400 scale-110 shadow-[0_0_15px_rgba(45,212,191,0.5)]" 
                                        : "bg-transparent border-slate-700",
                                    error && "border-red-500 bg-red-500/20"
                                )}
                            />
                        ))}
                    </div>

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-4">
                        {numpad.map((key, i) => {
                            if (key === "") return <div key={i} />;
                            if (key === "DEL") {
                                return (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-slate-400"
                                        onClick={handleDelete}
                                    >
                                        <Delete size={20} />
                                    </Button>
                                );
                            }
                            return (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-xl font-bold"
                                    onClick={() => handleNumberClick(key)}
                                >
                                    {key}
                                </Button>
                            );
                        })}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 h-14 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold"
                            onClick={() => onOpenChange(false)}
                        >
                            <X size={18} className="mr-2" /> Cancelar
                        </Button>
                        <Button
                            className="flex-1 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black shadow-lg shadow-teal-500/20"
                            onClick={handleValidate}
                            disabled={isValidating || pin.length < 4}
                        >
                            {isValidating ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} className="mr-2" /> Confirmar
                                </>
                            )}
                        </Button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <KeyRound size={12} />
                        Validación Cifrada 2026
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
