
"use client";

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Inbox,
    RefreshCw,
    User,
    Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketBadges';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface User { _id: string; email: string; nombre: string; }

export default function TicketList({ onSelectTicket }: { onSelectTicket: (t: Ticket) => void }) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Filtros Multi-Tenant (Dropdowns)
    const [tenants, setTenants] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [tenantFilter, setTenantFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (tenantFilter) params.append('tenantId', tenantFilter); // Soporte Multi-Tenant
            if (userFilter) params.append('userEmail', userFilter); // Filtro usuario

            const res = await fetch(`/api/soporte/tickets?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar Listas para filtros (Solo Admin)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Parallel fetch loose for UI resilience
                const [tRes, uRes] = await Promise.all([
                    fetch('/api/admin/tenants').catch(() => ({ ok: false, json: async () => ({}) })),
                    fetch('/api/admin/usuarios').catch(() => ({ ok: false, json: async () => ({}) }))
                ]);

                if (tRes && (tRes as any).ok) {
                    const data = await (tRes as any).json();
                    if (data?.tenants) setTenants(data.tenants);
                }
                if (uRes && (uRes as any).ok) {
                    const data = await (uRes as any).json();
                    if (data?.usuarios) setUsers(data.usuarios);
                }
            } catch (e) {
                // Silent fail for non-admins
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, tenantFilter, userFilter]);

    // Filtrado local por texto (más ágil)
    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Buscar ticket, email o ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm py-2.5 pl-9 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="OPEN">Abiertos</option>
                        <option value="IN_PROGRESS">En Progreso</option>
                        <option value="RESOLVED">Resueltos</option>
                    </select>

                    {/* Tenant Filter (Solo si tengo más de 1) */}
                    {tenants.length > 1 && (
                        <select
                            value={tenantFilter}
                            onChange={(e) => setTenantFilter(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px]"
                        >
                            <option value="">Todas las Empresas</option>
                            {tenants.map(t => (
                                <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
                            ))}
                        </select>
                    )}

                    {/* User Filter (Solo Admin con acceso a lista) */}
                    {users.length > 0 && (
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px]"
                        >
                            <option value="">Todos los Usuarios</option>
                            {users.map(u => (
                                <option key={u._id} value={u.email}>{u.email}</option>
                            ))}
                        </select>
                    )}

                    <Button variant="ghost" size="icon" onClick={fetchTickets} className="ml-auto">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && tickets.length === 0 ? (
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
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-slate-400 font-bold">{ticket.ticketNumber}</span>
                                        <TicketStatusBadge status={ticket.status} />
                                    </div>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}
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
