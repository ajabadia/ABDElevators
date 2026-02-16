import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Card } from '@/components/ui/card';
import { TraceViewer } from '@/components/admin/operations/TraceViewer';
import { TraceService } from '@/services/observability/TraceService';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { Search } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: {
        correlationId?: string;
    };
}

export default async function TracePage({ searchParams }: Props) {
    const user = await enforcePermission('admin:operations', 'read');
    const { correlationId } = searchParams;

    let logs = [];
    if (correlationId) {
        logs = await TraceService.getTrace(correlationId, user);
    }

    return (
        <PageContainer>
            <PageHeader
                title="Rastreo Técnico (Trace)"
                subtitle="Visualización end-to-end de peticiones y procesos del sistema."
                backHref="/admin/operations"
            />

            {!correlationId ? (
                <Card className="p-12 text-center border-dashed">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Introduce un Correlation ID</h2>
                        <p className="text-slate-500">
                            Para iniciar un rastreo, necesitas un ID de correlación. Puedes encontrarlo en los logs del sistema o en los reportes de error.
                        </p>
                        <form className="flex gap-2">
                            <input
                                name="correlationId"
                                type="text"
                                placeholder="Ej: 550e8400-e29b-41d4-a716-446655440000"
                                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button type="submit" className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                                Buscar
                            </button>
                        </form>
                    </div>
                </Card>
            ) : (
                <TraceViewer
                    logs={logs as any}
                    correlationId={correlationId}
                    loading={false}
                />
            )}
        </PageContainer>
    );
}
