"use client";

import { useUXStore } from "@/store/ux-store";
import { toast } from "sonner";
import { useOnboarding } from "./useOnboarding";

/**
 * 🧹 Hook for resetting all ephemeral user experience states.
 * Clears sessionStorage keys and resets global UI stores.
 */
export function useResetExperience() {
    const { resetUX } = useUXStore();
    const { resetOnboarding } = useOnboarding();

    const resetExperience = async () => {
        // 1. Clear common sessionStorage flags (MicroSurveys, Alerts)
        if (typeof window !== 'undefined') {
            // Find all common keys or just clear all if safe, 
            // but we target specific ones to be surgical.
            const keysToClear = [
                'admin_console_survey_dismissed',
                'ingest_success_survey_dismissed',
                'storage_limit_alert_dismissed'
            ];

            keysToClear.forEach(key => sessionStorage.removeItem(key));
        }

        // 2. Reset Global UX Store (Expert Mode, Help Mode)
        resetUX();

        // 3. Reset Onboarding Tour (Remote + Local state)
        await resetOnboarding();

        toast.success("Experiencia restablecida", {
            description: "Las ayudas, encuestas y tour se mostrarán de nuevo."
        });
    };

    return { resetExperience };
}
