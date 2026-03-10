"use client";

import { useEffect } from 'react';
import { SupportErrorState } from '@/components/shared/SupportErrorState';
import { logEvento } from '@/lib/logger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Registrar error en la base de datos de logs
        logEvento({
            level: 'ERROR',
            source: 'GLOBAL_ERROR_BOUNDARY',
            action: 'UNCAUGHT_EXCEPTION',
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
            context="Navegación General"
        />
    );
}
