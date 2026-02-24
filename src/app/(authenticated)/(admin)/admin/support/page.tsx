
"use client";

import React, { useState, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import TicketList from '@/components/support/TicketList';
import TicketDetail from '@/components/support/TicketDetail';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { RefreshCw, LifeBuoy, AlertOctagon, Clock, TrendingUp } from 'lucide-react';
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

    // 🎧 Phase 219: Real-time Stats Connection
    const { data: statsData, isLoading: statsLoading } = useApiItem<{
        activeTickets: number;
        criticalTickets: number;
        slaGlobal: string;
        iaDeflection: string;
    }>({
        endpoint: '/api/support/stats',
        dataKey: 'stats'
    });

    const onSelectTicket = useCallback((ticket: any) => {
        setSelectedTicketId(ticket._id);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const stats = statsData || {
        activeTickets: 0,
        criticalTickets: 0,
        slaGlobal: '...',
        iaDeflection: '...'
    };

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
                        <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} /> {t('actions.refresh') || 'Refresh'}
                    </Button>
                }
            />

            {/* Quick Metrics Summary (ERA 8 Consolidated - LIVE DATA) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tickets Activos</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {statsLoading && !statsData ? '...' : stats.activeTickets}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <LifeBuoy className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Críticos</p>
                        <p className="text-2xl font-black text-destructive mt-1">
                            {statsLoading && !statsData ? '...' : stats.criticalTickets}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                        <AlertOctagon className="w-5 h-5 text-red-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SLA Global</p>
                        <p className="text-2xl font-black text-emerald-500 mt-1">
                            {statsLoading && !statsData ? '...' : stats.slaGlobal}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deflección IA</p>
                        <p className="text-2xl font-black text-purple-500 mt-1">
                            {statsLoading && !statsData ? '...' : stats.iaDeflection}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                </div>
            </div>

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
