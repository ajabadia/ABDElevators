'use client';

import React from 'react';
import { GlobalPatternsTable } from './GlobalPatternsTable';
import { useApiMutation } from '@/hooks/useApiMutation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface InsightGovernanceProps {
    patterns: any[];
}

export function InsightGovernance({ patterns }: InsightGovernanceProps) {
    const router = useRouter();

    const { mutate: archivePattern } = useApiMutation({
        endpoint: '/api/admin/intelligence/patterns',
        method: 'PATCH',
        onSuccess: () => {
            toast.success('Patrón archivado correctamente');
            router.refresh(); // Trigger server-side re-fetch
        },
        onError: () => toast.error('Error al archivar el patrón')
    });

    const handleArchive = (id: string) => {
        archivePattern({ patternId: id, action: 'ARCHIVE' });
    };

    return (
        <GlobalPatternsTable patterns={patterns} onArchive={handleArchive} />
    );
}
