"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

// Modular Components
import { DetailSpecs } from "./details/DetailSpecs";
import { DetailBenefits } from "./details/DetailBenefits";

interface FeatureDetailDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    featureKey: string; // Key in details.json (e.g., 'industrial_maintenance')
}

/**
 * FeatureDetailDialog — ERA 14 Refactor
 * 
 * Shared modal for displaying feature details (specs, benefits).
 * Refactored into modular sub-components for better maintainability.
 */
export function FeatureDetailDialog({
    isOpen,
    onOpenChange,
    featureKey,
}: FeatureDetailDialogProps) {
    // Handling namespace with a fallback to avoid Crashes if the key is missing
    let t: any;
    try {
        t = useTranslations("details");
    } catch (e) {
        t = (key: string) => key;
        t.raw = () => [];
    }

    // Helper to get raw translation arrays securely
    const getList = (key: string) => {
        if (!featureKey) return [];
        try {
            const data = t.raw(`${featureKey}.${key}`);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    };

    const specs = getList("specs");
    const benefits = getList("benefits");
    const title = featureKey ? t(`${featureKey}.title`) : "Detalle";
    const description = featureKey ? t(`${featureKey}.description`) : "";

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-slate-950 border-white/10 text-white p-0 overflow-hidden rounded-3xl outline-none">
                <div className="relative p-8 md:p-12">
                    {/* Decorative Background effects */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

                    <DialogHeader className="relative z-10 mb-8 border-none bg-transparent">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                                <ShieldCheck className="w-6 h-6 text-teal-400" />
                            </div>
                            <DialogTitle className="text-3xl font-bold font-outfit tracking-tight text-white border-none bg-transparent">
                                {title}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-lg text-slate-300 leading-relaxed text-left border-none bg-transparent">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailSpecs specs={specs} />
                        <DetailBenefits benefits={benefits} />
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                        <DialogClose asChild>
                            <button
                                className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors border border-white/10 cursor-pointer"
                            >
                                Cerrar detalle
                            </button>
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
