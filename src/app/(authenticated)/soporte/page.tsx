
"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    LifeBuoy,
    MessageSquare,
    Search,
    Clock,
    User,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketBadges';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { AgenticSupportSearch } from '@/components/tecnico/AgenticSupportSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    createdAt: string;
}

export default function ClientSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await fetch('/api/soporte/tickets');
                if (res.ok) {
                    const data = await res.json();
                    setTickets(data.tickets || []);
                }
            } catch (error) {
                console.error("Error fetching tickets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <LifeBuoy className="w-10 h-10 text-blue-600" />
                        Centro de Soporte Técnico
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Consulta a nuestra IA agéntica o gestiona tus tickets de soporte.
                    </p>
                </div>
                <Link href="/soporte/nuevo">
                    <Button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5 mr-2" /> Nuevo Ticket
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="ai-search" className="space-y-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-14 rounded-2xl grid grid-cols-2 max-w-md border border-slate-200 dark:border-slate-700">
                    <TabsTrigger value="ai-search" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <Sparkles className="w-4 h-4 mr-2" /> Consulta IA
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <MessageSquare className="w-4 h-4 mr-2" /> Mis Tickets
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ai-search" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <AgenticSupportSearch />
                </TabsContent>

                <TabsContent value="tickets" className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                        {/* Toolbar */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar tus tickets..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {tickets.length} Tickets Totales
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <div className="p-20 text-center text-slate-400">Cargando tus tickets...</div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                        <MessageSquare className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tienes tickets abiertos</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-8">
                                        Si tienes algún problema con la plataforma o necesitas asistencia técnica, no dudes en contactarnos.
                                    </p>
                                    <Link href="/soporte/nuevo">
                                        <Button variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700">
                                            Crear mi primer ticket
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <div key={ticket._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <TicketStatusBadge status={ticket.status} />
                                                <TicketPriorityBadge priority={ticket.priority} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> Actualizado {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase text-[10px]">
                                                    {ticket.category}
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/soporte/${ticket._id}`}>
                                            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0">
                                                Ver conversación <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
