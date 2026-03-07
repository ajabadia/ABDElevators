'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useUXStore } from '@/store/ux-store';

type UxMode = 'simple' | 'expert';

interface UxModeContextType {
    uxMode: UxMode;
    setUxMode: (mode: UxMode) => Promise<void>;
    isPending: boolean;
    isExpert: boolean;
}

const UxModeContext = createContext<UxModeContextType | undefined>(undefined);

/**
 * 🎨 Provider for UX Mode (Simple vs Expert)
 * FASE 253: UX MODE SIMPLE vs EXPERT
 */
export function UxModeProvider({
    children,
    initialMode = 'simple'
}: {
    children: React.ReactNode;
    initialMode?: UxMode;
}) {
    const [uxMode, setUxModeState] = useState<UxMode>(initialMode);
    const [isPending, startTransition] = useTransition();

    const setUxMode = async (mode: UxMode) => {
        startTransition(async () => {
            try {
                const res = await fetch('/api/user/ux-mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uxMode: mode }),
                });

                if (!res.ok) throw new Error('Failed to update UX mode');

                setUxModeState(mode);
                useUXStore.getState().setExpertMode(mode === 'expert'); // Phase 297 Sync

                toast.success(mode === 'expert' ? 'Expert Mode Enabled' : 'Simple Mode Enabled');
            } catch (error) {
                console.error('Error updating UX mode:', error);
                toast.error('Could not save UX mode preference');
            }
        });
    };

    // Keyboard shortcut: Shift + X to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toUpperCase() === 'X') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
                const newMode = uxMode === 'simple' ? 'expert' : 'simple';
                setUxMode(newMode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [uxMode]);

    return (
        <UxModeContext.Provider value={{
            uxMode,
            setUxMode,
            isPending,
            isExpert: uxMode === 'expert'
        }}>
            {children}
        </UxModeContext.Provider>
    );
}

export function useUxMode() {
    const context = useContext(UxModeContext);
    if (context === undefined) {
        throw new Error('useUxMode must be used within a UxModeProvider');
    }
    return context;
}
