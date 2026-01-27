
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

export default function AdminSoportePage() {
    const [selectedTicket, setSelectedTicket] = useState<TicketUI | null>(null);

    return (
        <div className="flex gap-6 animate-in fade-in duration-500 max-w-7xl mx-auto h-[calc(100vh-140px)]">
            {/* Sidebar List */}
            <div className="w-1/3 min-w-[350px] flex flex-col">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Centro de <span className="text-teal-600">Soporte</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión de incidencias y ayuda técnica.</p>
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
