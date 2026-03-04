"use client";

import React, { useEffect } from 'react';
import { useUXStore } from '@/store/ux-store';
import { toast } from 'sonner';
import { isEra10Mode } from '@/lib/era10-mode';

interface UXProviderProps {
    children: React.ReactNode;
}

/**
 * Global UX Provider - Phase 253
 * 
 * Handles global keyboard shortcuts (Shift+X) and hydration of UX state.
 */
export const UXProvider: React.FC<UXProviderProps> = ({ children }) => {
    const { toggleExpertMode, expertMode, setExpertMode } = useUXStore();

    // Reset to simple mode on first load if Era 10 is active to ensure "Clarity"
    useEffect(() => {
        if (isEra10Mode()) {
            // We don't force it every time, just provide a sensible default
            // usually handled by the store, but here we can add logic for transition
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift + X toggle
            if (e.shiftKey && (e.key === 'X' || e.key === 'x')) {
                // Don't toggle if user is typing in an input
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }

                e.preventDefault();
                toggleExpertMode();

                // We use a timeout to let the state update before reading for the toast
                // but since zustand is sync, we can just use the inverse of current
                const newMode = !expertMode;
                toast.info(newMode ? "Modo Experto Activado" : "Modo Experto Desactivado", {
                    description: newMode ? "Ahora verás métricas técnicas y detalles avanzados." : "Interfaz simplificada para mayor claridad.",
                    duration: 3000,
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleExpertMode, expertMode]);

    return <>{children}</>;
};
