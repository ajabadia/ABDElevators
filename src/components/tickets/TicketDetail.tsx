
"use client";

import React, { useState } from 'react';
import {
    Clock,
    User,
    Building,
    Mail,
    Paperclip,
    Send,
    Loader2,
    Shield,
    GitBranch,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketBadges';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
    messages?: Array<{
        id: string;
        author: 'User' | 'Support' | 'System';
        authorName?: string;
        content: string;
        timestamp: string;
        isInternal?: boolean;
    }>;
    internalNotes?: Array<{
        id: string;
        author: string;
        content: string;
        timestamp: string;
    }>;
}

export default function TicketDetail({ ticket }: { ticket: Ticket | null }) {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    // Para UX instántanea, podríamos usar estado local optimista, pero por ahora reload simple o revalidación
    // Como esto es cliente, idealmente 'onReplySuccess' callback para recargar la data en el padre.
    // Vamos a asumir que el padre pasará una función de refresh o implementaremos un mutate simple.

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
        try {
            const res = await fetch(`/api/soporte/tickets/${ticket._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: reply })
            });

            if (res.ok) {
                setReply('');
                window.location.reload();
            } else {
                alert("Error al enviar respuesta");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const handleEscalate = async (target: string) => {
        const note = prompt("Motivo del escalamiento (opcional):");
        if (note === null) return; // Cancelado
        try {
            const res = await fetch(`/api/soporte/tickets/${ticket._id}/reassign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: target, note })
            });
            if (res.ok) window.location.reload();
        } catch (e) {
            alert("Error al escalar");
        }
    };

    const handleInternalNote = async () => {
        const content = prompt("Escribe una nota interna (solo visible para administradores):");
        if (!content) return;

        setSending(true);
        try {
            const res = await fetch(`/api/soporte/tickets/${ticket._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isInternal: true })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                alert("Error al guardar nota");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
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

                {/* Support Actions Bar */}
                <div className="flex gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" size="sm" className="h-9 text-xs border-slate-200" onClick={handleInternalNote}>
                        <Shield size={14} className="mr-2 text-amber-500" /> Nota Interna
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-xs border-slate-200">
                                <GitBranch size={14} className="mr-2 text-blue-500" /> Escalar / Reasignar <ChevronDown size={14} className="ml-2 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem onClick={() => handleEscalate('SOPORTE_L2')}>
                                <div className="flex flex-col">
                                    <span className="font-bold">Soporte Nivel 2</span>
                                    <span className="text-[10px] text-slate-400">Técnicos Senior</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEscalate('SOPORTE_L3')}>
                                <div className="flex flex-col">
                                    <span className="font-bold">Equipo Ingeniería (L3)</span>
                                    <span className="text-[10px] text-slate-400">Desarrollo ABD</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEscalate('ADMIN_MASTER')}>
                                <div className="flex flex-col">
                                    <span className="font-bold">Administrador General</span>
                                    <span className="text-[10px] text-slate-400">Supervisión Master</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

                {/* Timeline Messages */}
                {ticket.messages && ticket.messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4", msg.author === 'Support' ? "flex-row-reverse" : "")}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs",
                            msg.author === 'Support'
                                ? (msg.isInternal ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-purple-100 text-purple-600 dark:bg-purple-900/30")
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                        )}>
                            {msg.author === 'Support' ? (msg.isInternal ? <Shield size={12} /> : 'S') : 'U'}
                        </div>
                        <div className={cn("space-y-2 max-w-3xl", msg.author === 'Support' ? "items-end flex flex-col" : "")}>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {msg.authorName || msg.author}
                                    {msg.isInternal && <span className="ml-2 text-[9px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">Interna</span>}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {format(new Date(msg.timestamp), "d MMM HH:mm", { locale: es })}
                                </span>
                            </div>
                            <div className={cn(
                                "p-4 shadow-sm border text-sm leading-relaxed whitespace-pre-wrap",
                                msg.author === 'Support'
                                    ? (msg.isInternal
                                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 text-amber-900 dark:text-amber-100 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl italic"
                                        : "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30 text-purple-900 dark:text-purple-100 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl")
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Placeholder para fin */}
                <div className="flex justify-center">
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        Inicio del ticket {format(new Date(ticket.createdAt), "d MMM yyyy")}
                    </span>
                </div>
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Textarea
                            placeholder="Escribe una respuesta pública..."
                            className="min-h-[100px] resize-none pr-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-1 focus:ring-teal-500"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute bottom-2 right-2 text-slate-400 hover:text-teal-500"
                        >
                            <Paperclip size={18} />
                        </Button>
                    </div>
                    <Button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || sending}
                        className="h-auto self-end px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
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
