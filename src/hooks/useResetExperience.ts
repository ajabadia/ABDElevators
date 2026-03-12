"use client";

import { useUXStore } from "@/store/ux-store";
import { toast } from "sonner";
import { useOnboarding } from "./useOnboarding";
import { useEphemeralStore } from "@/store/ephemeral-store";

/**
 * 🧹 Hook for resetting all ephemeral user experience states.
 * Clears sessionStorage keys and resets global UI stores.
 */
export function useResetExperience() {
    const { resetUX } = useUXStore();
    const { resetOnboarding } = useOnboarding();
    const { resetEphemeral } = useEphemeralStore();

    const resetExperience = async () => {
        // 1. Clear ephemeral flags (MicroSurveys, Alerts) via resetEphemeral
        resetEphemeral();

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
