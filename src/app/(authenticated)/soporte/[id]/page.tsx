
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Send,
    Loader2,
    Ticket as TicketIcon // Renombrado para evitar colisión si es necesario
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketBadges';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    createdAt: string;
    messages?: Array<{
        id: string;
        author: 'User' | 'Support' | 'System';
        content: string;
        timestamp: string;
    }>;
}

export default function ClientTicketDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    // Fetch simple del ticket
    // NOTA: Para MVP reutilizamos /api/soporte/tickets con filtro, aunque idealmente sería /api/soporte/tickets/[id]
    // Como el endpoint de lista filtra por usuario, podemos hacer fetch de la lista y buscar este ID, 
    // o mejorar el backend para GET /tickets/[id]. 
    // Para no tocar backend ahora, asumiremos que una llamada a /api/soporte/tickets/[id] existe o la creamos
    // Oh wait, no creamos GET /api/soporte/tickets/[id] todavía.
    // ESTRATEGIA: Vamos a crear ese GET endpoint también, o filtrar en cliente.
    // Filtrar en cliente es feo. 
    // Vamos a asumir que EXISTE UN ENDPOINT que devuelve el ticket completo con mensajes.
    // Vaya, reusaré el ticket list logic pero necesito los mensajes.
    // Ticket List NO devuelve mensajes.
    // NECESITO crear GET /api/soporte/tickets/[id]

    // Como estoy en frontend, voy a escribir el frontend asumiendo que el backend responderá. 
    // Luego arreglo el backend.

    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/soporte/tickets/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setTicket(data.ticket);
            } else {
                toast({ title: "Error", description: "No se pudo cargar el ticket", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [params.id]);

    const handleSendReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/soporte/tickets/${params.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: reply })
            });

            if (res.ok) {
                setReply('');
                fetchTicket(); // Recargar para ver mensaje nuevo
                toast({ title: "Mensaje envíado", description: "El equipo de soporte ha sido notificado." });
            } else {
                toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
    if (!ticket) return <div className="p-20 text-center">Ticket no encontrado</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <Link href="/soporte" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis tickets
            </Link>

            {/* Header Clean */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm">
                            {ticket.ticketNumber}
                        </span>
                        <TicketStatusBadge status={ticket.status} />
                    </div>
                    <span className="text-sm text-slate-400">{format(new Date(ticket.createdAt), "PPP", { locale: es })}</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{ticket.subject}</h1>
                <div className="flex gap-2">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase text-[10px] text-slate-500">{ticket.category}</span>
                </div>
            </div>

            {/* Conversation */}
            <div className="space-y-6">
                {/* Original Description */}
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                        Yo
                    </div>
                    <div className="space-y-1 max-w-2xl">
                        <div className="text-xs text-slate-400 font-bold ml-1">Descripción Inicial</div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {ticket.messages?.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4", msg.author === 'User' ? "" : "flex-row-reverse")}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                            msg.author === 'User' ? "bg-slate-200 dark:bg-slate-800 text-slate-500" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                        )}>
                            {msg.author === 'User' ? 'Yo' : <TicketIcon size={18} />}
                        </div>
                        <div className={cn("space-y-1 max-w-2xl", msg.author === 'User' ? "" : "items-end flex flex-col")}>
                            <div className="text-xs text-slate-400 font-bold mx-1">
                                {msg.author === 'User' ? 'Tú' : 'Soporte Técnico'} • {format(new Date(msg.timestamp), "HH:mm")}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl shadow-sm border whitespace-pre-wrap",
                                msg.author === 'User'
                                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                                    : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200 rounded-tr-none"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Input */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl sticky bottom-4">
                <Textarea
                    placeholder="Escribe una respuesta para el soporte..."
                    className="min-h-[100px] resize-none mb-4 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Tu respuesta notificará al equipo técnico inmediatamente.</p>
                    <Button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 shadow-lg shadow-blue-500/20"
                    >
                        {sending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Enviar Mensaje
                    </Button>
                </div>
            </div>
            <div className="h-12" />
        </div>
    );
}
