"use client";

import React, { useState, useMemo } from 'react';
import {
    Search,
    Inbox,
    RefreshCw,
    User,
    Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketBadges';
import { formatRelative } from '@/lib/date-utils';
import { useApiList } from '@/hooks/useApiList';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    userEmail: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

import { useFilterState } from '@/hooks/useFilterState';

export default function TicketList({
    onSelectTicket,
    selectedId
}: {
    onSelectTicket: (t: Ticket) => void,
    selectedId?: string | null
}) {
    // 1. Gestión de Estado de Filtros Centralizada
    const {
        filters,
        setFilter
    } = useFilterState({
        initialFilters: {
            search: '',
            status: '',
            tenantId: '',
            userEmail: ''
        }
    });

    // 2. Gestión de datos con hook genérico
    const { data: tickets, isLoading, refresh } = useApiList<Ticket>({
        endpoint: '/api/soporte/tickets',
        dataKey: 'tickets',
        filters: {
            status: filters.status,
            tenantId: filters.tenantId,
            userEmail: filters.userEmail
        }
    });

    // 3. Fetch de filtros (Listas para dropdowns)
    const { data: tenants } = useApiList<any>({ endpoint: '/api/admin/tenants', dataKey: 'tenants' });
    const { data: users } = useApiList<any>({ endpoint: '/api/admin/usuarios', dataKey: 'usuarios' });

    // Filtrado local por texto para inmediatez
    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        const s = filters.search.toLowerCase();
        return tickets.filter(t =>
            t.subject.toLowerCase().includes(s) ||
            t.ticketNumber.toLowerCase().includes(s) ||
            t.userEmail.toLowerCase().includes(s)
        );
    }, [tickets, filters.search]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Buscar ticket, email o ID..."
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm py-2.5 pl-9 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilter('status', e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="OPEN">Abiertos</option>
                        <option value="IN_PROGRESS">En Progreso</option>
                        <option value="RESOLVED">Resueltos</option>
                    </select>

                    {tenants && tenants.length > 1 && (
                        <select
                            value={filters.tenantId}
                            onChange={(e) => setFilter('tenantId', e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px]"
                        >
                            <option value="">Todas las Empresas</option>
                            {tenants.map(t => (
                                <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
                            ))}
                        </select>
                    )}

                    {users && users.length > 0 && (
                        <select
                            value={filters.userEmail}
                            onChange={(e) => setFilter('userEmail', e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px]"
                        >
                            <option value="">Todos los Usuarios</option>
                            {users.map(u => (
                                <option key={u._id} value={u.email}>{u.email}</option>
                            ))}
                        </select>
                    )}

                    <Button variant="ghost" size="icon" onClick={() => refresh()} className="ml-auto">
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && (!tickets || tickets.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 text-xs">Cargando tickets...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <Inbox size={32} className="mb-2 opacity-50" />
                        <p className="text-xs">No hay tickets que coincidan</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket._id}
                                onClick={() => onSelectTicket(ticket)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all group border-l-4",
                                    selectedId === ticket._id
                                        ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-blue-600 shadow-inner"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-slate-400 font-bold">{ticket.ticketNumber}</span>
                                        <TicketStatusBadge status={ticket.status} />
                                    </div>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {formatRelative(ticket.createdAt)}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                                    {ticket.subject}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <TicketPriorityBadge priority={ticket.priority} />
                                        <span className="flex items-center gap-1 opacity-70" title={ticket.userEmail}>
                                            <User size={10} /> {ticket.userEmail.split('@')[0]}
                                        </span>
                                    </div>
                                    {ticket.tenantId && (
                                        <div className="flex items-center gap-1 opacity-50">
                                            <Building size={10} />
                                            <span className="font-mono text-[10px]">{ticket.tenantId.substring(0, 8)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
