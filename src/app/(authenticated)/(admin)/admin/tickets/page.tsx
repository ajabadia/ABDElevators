
"use client";

import React, { useState } from 'react';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { Ticket } from '@/lib/ticket-schema';

// Adaptador de tipo para la UI (el schema backend y frontend pueden diferir ligeramente en Date vs string)
// Aquí re-definimos para ser prácticos en la UI
interface TicketUI {
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
}

export default function AdminTicketsPage() {
    const [selectedTicket, setSelectedTicket] = useState<TicketUI | null>(null);

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 p-6 animate-in fade-in duration-500">
            {/* Sidebar List */}
            <div className="w-1/3 min-w-[350px] flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Support Center</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión de Incidencias</p>
                </div>
                <TicketList onSelectTicket={(t) => setSelectedTicket(t as any)} />
            </div>

            {/* Main Detail Area */}
            <div className="flex-1 flex flex-col pt-16">
                <TicketDetail ticket={selectedTicket} />
            </div>
        </div>
    );
}
