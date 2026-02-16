import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Card } from '@/components/ui/card';
import { ConfigAuditTable } from '@/components/admin/audit/ConfigAuditTable';
import { ConfigAuditService } from '@/services/audit/ConfigAuditService';
import { enforcePermission } from '@/lib/guardian-guard';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConfigAuditPage() {
    const user = await enforcePermission('admin:security', 'read');
    const events = await ConfigAuditService.getHistory(100, user);

    return (
        <PageContainer>
            <PageHeader
                title="Auditoría de Configuración"
                subtitle="Historial de cambios sensibles en la configuración del sistema."
                backHref="/admin/security"
            />

            <div className="space-y-6">
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4 flex items-start gap-4">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Zona de Alta Sensibilidad</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            Este registro es inmutable. Cualquier cambio en Prompts, Feature Flags o Configuración Global queda registrado aquí permanentemente por motivos de cumplimiento (SOC2/GDPR).
                        </p>
                    </div>
                </Card>

                <ConfigAuditTable events={events as any} />
            </div>
        </PageContainer>
    );
}
