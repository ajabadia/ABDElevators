"use client";

import { useEffect } from 'react';
import { SupportErrorState } from '@/components/shared/SupportErrorState';
import { logEvento } from '@/lib/logger';

/**
 * Optimized Error Boundary for Authenticated Area (PHASE 345).
 * Captures dashboard failures and provides a contextual support path.
 */
export default function AuthenticatedError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logEvento({
            level: 'ERROR',
            source: 'AUTH_LAYOUT_BOUNDARY',
            action: 'DASHBOARD_EXCEPTION',
            message: error.message,
            details: {
                digest: error.digest,
                stack: error.stack,
                url: typeof window !== 'undefined' ? window.location.href : 'N/A'
            }
        });
    }, [error]);

    return (
        <SupportErrorState
            error={error}
            reset={reset}
            context="Dashboard Autenticado"
        />
    );
}
