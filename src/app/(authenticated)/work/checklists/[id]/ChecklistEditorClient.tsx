import React from 'react';
import { ConfiguratorFull } from '@/verticals/elevators/components/configurator/ConfiguratorFull';
import { ChecklistConfig } from '@/lib/schemas';

interface ChecklistEditorClientProps {
    config?: ChecklistConfig;
    isNew?: boolean;
}

/**
 * 📝 Checklist Editor Client Component
 * Handles the client-side interaction for the checklist configurator.
 */
export function ChecklistEditorClient({ config, isNew = false }: ChecklistEditorClientProps) {
    return (
        <ConfiguratorFull initialConfig={config} isNew={isNew} />
    );
}
