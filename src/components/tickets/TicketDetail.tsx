
"use client";

import React, { useState } from 'react';
import {
    Clock,
    User,
    Building,
    Mail,
    Paperclip,
    Send,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketBadges';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ticket {
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

export default function TicketDetail({ ticket }: { ticket: Ticket | null }) {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    if (!ticket) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Ningún ticket seleccionado</h3>
                <p className="text-sm mt-2 max-w-xs">Selecciona un ticket de la lista para ver los detalles, el historial y responder al cliente.</p>
            </div>
        );
    }

    const handleSendReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        // TODO: Implementar llamada a API para responder
        await new Promise(r => setTimeout(r, 1000)); // Mock
        setReply('');
        setSending(false);
        // toast or refresh
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {ticket.ticketNumber}
                        </h2>
                        <TicketStatusBadge status={ticket.status} />
                    </div>
                    <div className="text-right text-xs text-slate-400">
                        <p>{format(new Date(ticket.createdAt), "PPP p", { locale: es })}</p>
                    </div>
                </div>

                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-snug">
                    {ticket.subject}
                </h1>

                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <User size={14} className="text-slate-400" />
                        <span className="font-medium">{ticket.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Building size={14} className="text-slate-400" />
                        <span className="font-mono">{ticket.tenantId}</span>
                    </div>
                    <TicketPriorityBadge priority={ticket.priority} />
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono uppercase text-[10px] font-bold text-slate-500">
                        {ticket.category}
                    </span>
                </div>
            </div>

            {/* Content & History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 dark:bg-slate-900/30">
                {/* Original Issue */}
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                        U
                    </div>
                    <div className="space-y-2 max-w-3xl">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{ticket.userEmail.split('@')[0]}</span>
                            <span className="text-xs text-slate-400">reportó el problema</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </div>
                </div>

                {/* Placeholder para respuestas (Timeline) */}
                <div className="flex justify-center">
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        Ticket creado el {format(new Date(ticket.createdAt), "d MMM yyyy")}
                    </span>
                </div>
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Textarea
                            placeholder="Escribe una respuesta pública..."
                            className="min-h-[100px] resize-none pr-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-1 focus:ring-blue-500"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute bottom-2 right-2 text-slate-400 hover:text-blue-500"
                        >
                            <Paperclip size={18} />
                        </Button>
                    </div>
                    <Button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || sending}
                        className="h-auto self-end px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    >
                        {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    </Button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                    Markdown soportado. Las respuestas se envían por email al usuario.
                </p>
            </div>
        </div>
    );
}
