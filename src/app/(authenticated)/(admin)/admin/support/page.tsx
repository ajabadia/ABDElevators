
"use client";

import React, { useState, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import TicketList from '@/components/support/TicketList';
import TicketDetail from '@/components/support/TicketDetail';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminTicketListSkeleton, TicketDetailSkeleton } from '@/components/shared/LoadingSkeleton';

export interface TicketUI {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    userEmail: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
    messages?: Array<any>;
}

export default function AdminSoportePage() {
    const t = useTranslations('admin.support');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const onSelectTicket = useCallback((ticket: any) => {
        setSelectedTicketId(ticket._id);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <PageContainer className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <PageHeader
                title={t('title')}
                highlight="Tickets"
                subtitle={t('subtitle')}
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="rounded-xl border-slate-200"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> {t('actions.refresh') || 'Refresh'}
                    </Button>
                }
            />

            <div className="flex gap-6 mt-6 flex-1 overflow-hidden min-h-0">
                {/* Panel Izquierdo: Lista de Tickets */}
                <div className="w-full md:w-[400px] flex flex-col h-full shrink-0">
                    <Suspense fallback={<AdminTicketListSkeleton />}>
                        <TicketList
                            onSelectTicket={onSelectTicket}
                            selectedId={selectedTicketId}
                            key={`list-${refreshTrigger}`}
                        />
                    </Suspense>
                </div>

                {/* Panel Derecho: Detalle del Ticket */}
                <div className="flex-1 flex flex-col h-full">
                    {selectedTicketId ? (
                        <TicketDetailWrapper
                            ticketId={selectedTicketId}
                            onActionComplete={handleRefresh}
                            key={`detail-${selectedTicketId}-${refreshTrigger}`}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <RefreshCw className="w-10 h-10 opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">{t('title')}</h3>
                            <p className="text-sm mt-2 max-w-xs font-medium text-slate-500">{t('placeholder_desc') || 'Select a case from the left panel to see conversation and take actions.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}

// Wrapper para manejar el fetch individual del ticket seleccionado y así
// asegurar que tenemos los últimos mensajes al seleccionar/recargar.
import { useApiItem } from '@/hooks/useApiItem';

function TicketDetailWrapper({
    ticketId,
    onActionComplete
}: {
    ticketId: string,
    onActionComplete: () => void
}) {
    const { data: ticket, isLoading, refresh } = useApiItem<TicketUI>({
        endpoint: `/api/support/tickets/${ticketId}`,
        dataKey: 'ticket'
    });

    if (isLoading && !ticket) return <TicketDetailSkeleton />;

    const handleAction = () => {
        refresh(); // Refrescar este ticket
        onActionComplete(); // Refrescar la lista global
    };

    return (
        <TicketDetail
            ticket={ticket}
            onRefresh={handleAction}
        />
    );
}
