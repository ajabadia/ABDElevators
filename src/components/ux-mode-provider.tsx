'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useUXStore } from '@/store/ux-store';
import { getCsrfToken, useSession } from 'next-auth/react';

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
    const { update: updateSession } = useSession();
    const [uxMode, setUxModeState] = useState<UxMode>(initialMode);
    const [isPending, startTransition] = useTransition();

    // Phase 299: Sync initial state from session to store on mount
    useEffect(() => {
        useUXStore.getState().setExpertMode(initialMode === 'expert');
    }, [initialMode]);

    const setUxMode = async (mode: UxMode) => {
        startTransition(async () => {
            try {
                const csrfToken = await getCsrfToken();
                const res = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken || ''
                    },
                    body: JSON.stringify({ 
                        preferences: { uxMode: mode } 
                    }),
                });

                if (!res.ok) {
                    const text = await res.text();
                    let errorMessage = `Status ${res.status}`;
                    try {
                        const errorData = JSON.parse(text);
                        // Extract message from AppError structure: { error: { message: '...' } }
                        errorMessage = errorData.error?.message || errorData.message || errorData.error || errorMessage;
                        console.error('Server error response:', errorData);
                    } catch (e) {
                        errorMessage = text || errorMessage;
                        console.error('Raw error response:', text);
                    }
                    throw new Error(errorMessage);
                }

                setUxModeState(mode);
                useUXStore.getState().setExpertMode(mode === 'expert'); // Phase 297 Sync

                // Phase 299: Force session update to persist in JWT/Cookie for Next.js refreshes
                await updateSession({
                    user: {
                        preferences: { uxMode: mode }
                    }
                });

                toast.success(mode === 'expert' ? 'Expert Mode Enabled' : 'Simple Mode Enabled');
            } catch (error: any) {
                console.error('UX Mode Update Failed:', {
                    mode,
                    message: error.message,
                    originalError: error
                });
                toast.error('Could not save UX mode preference', {
                    description: error.message || 'Check console for details'
                });
                
                // Fallback to local state if server fails (optimistic UX)
                setUxModeState(mode);
                useUXStore.getState().setExpertMode(mode === 'expert');
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
