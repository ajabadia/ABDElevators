"use client";

import { useEffect } from 'react';
import { SupportErrorState } from '@/components/shared/SupportErrorState';
import { logEvento } from '@/lib/logger';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logEvento({
            level: 'ERROR',
            source: 'ADMIN_DASHBOARD',
            action: 'LOAD_ERROR',
            message: error.message,
            details: {
                digest: error.digest,
                url: typeof window !== 'undefined' ? window.location.href : 'N/A'
            }
        });
    }, [error]);

    return (
        <SupportErrorState
            error={error}
            reset={reset}
            context="Admin Dashboard"
        />
    );
}
