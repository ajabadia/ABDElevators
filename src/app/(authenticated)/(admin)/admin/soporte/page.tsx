
"use client";

import React, { useState } from 'react';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageContainer>
            <PageHeader
                title="Centro de Soporte"
                highlight="Soporte"
                subtitle="Gestión de incidencias y ayuda técnica."
                actions={<TicketList onSelectTicket={(t) => setSelectedTicket(t as any)} />}
            />

            {/* Main Detail Area */}
            <div className="flex-1 flex flex-col">
                <TicketDetail ticket={selectedTicket} />
            </div>
        </PageContainer>
    );
}
