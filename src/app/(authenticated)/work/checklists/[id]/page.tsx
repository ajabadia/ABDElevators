import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { ChecklistConfig } from '@/lib/schemas';
import { NotFoundError } from '@/lib/errors';
import { ChecklistEditorClient } from './ChecklistEditorClient';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { ClipboardCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface ChecklistEditorPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Page: /work/checklists/[id]
 * Specialized editor for existing checklist configurations.
 * Secured with Guardian V3 (Phase 9 modernization).
 */
export default async function ChecklistEditorPage({ params }: ChecklistEditorPageProps) {
    const { id } = await params;
    const isNew = id === 'new';

    // 1. Permission check (Server-side)
    const session = await requirePermission('admin:checklist-configs', 'manage');
    const t = await getTranslations('admin_configurator');

    let config: ChecklistConfig | null = null;

    if (!isNew) {
        if (!ObjectId.isValid(id)) {
            throw new NotFoundError(`ID de configuración inválido: ${id}`);
        }

        // 2. Data fetching (Server-side)
        const collection = await getTenantCollection('checklist_configs', session);
        const rawConfig = await collection.findOne({ _id: new ObjectId(id) });

        if (!rawConfig) {
            throw new NotFoundError(`Configuración de checklist ${id} no encontrada`);
        }

        // Serialize MongoDB objects for the client
        config = JSON.parse(JSON.stringify(rawConfig));
    }

    return (
        <FeatureShell
            title={config?.name || t('new_config')}
            subtitle={t('subtitle')}
            icon={<ClipboardCheck className="w-6 h-6 text-primary" />}
            backHref="/work/checklists"
        >
            <div className="mt-6">
                <ChecklistEditorClient config={config || undefined} isNew={isNew} />
            </div>
        </FeatureShell>
    );
}
