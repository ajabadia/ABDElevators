'use client';

import React, { useState, useEffect } from 'react';
import {
    LifeBuoy,
    Search,
    Filter,
    MessageSquare,
    Clock,
    CheckCircle2,
    Loader2,
    User,
    Mail,
    MoreVertical,
    ChevronRight,
    ExternalLink,
    Shield,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContactRequest } from '@/lib/schemas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function AdminContactsPage() {
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
    const [respuesta, setRespuesta] = useState('');
    const [isResponding, setIsResponding] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/contacts');
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRespond = async () => {
        if (!selectedRequest || !respuesta.trim()) return;
        setIsResponding(true);

        try {
            const res = await fetch('/api/admin/contacts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: (selectedRequest as any)._id,
                    respuesta
                })
            });

            if (res.ok) {
                toast({ title: "Respuesta enviada", description: "El usuario recibirá una notificación." });
                setRespuesta('');
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo enviar la respuesta.", variant: "destructive" });
        } finally {
            setIsResponding(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'HIGH': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <LifeBuoy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Gestión de Soporte
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-12">
                        Atiende las solicitudes de técnicos de todos los tenants.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchRequests} className="rounded-xl">
                        <Clock className="w-4 h-4 mr-2" /> Actualizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List Section */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    placeholder="Buscar por usuario o asunto..."
                                    className="w-full bg-white dark:bg-slate-900 border-none text-sm focus:ring-0 pl-10 h-10"
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl"><Filter size={18} /></Button>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>
                            ) : requests.length === 0 ? (
                                <div className="p-20 text-center text-slate-500">No hay solicitudes pendientes.</div>
                            ) : (
                                requests.map((req) => (
                                    <div
                                        key={(req as any)._id}
                                        onClick={() => setSelectedRequest(req)}
                                        className={cn(
                                            "p-6 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group flex items-start gap-4",
                                            selectedRequest === req && "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                                        )}
                                    >
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                            <MessageSquare className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getPriorityColor(req.prioridad))}>
                                                        {req.prioridad}
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        req.estado === 'pendiente' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                    )}>
                                                        {req.estado}
                                                    </span>
                                                </div>
                                                <time className="text-[10px] text-slate-400 font-medium">
                                                    {format(new Date(req.creado), "d MMM, HH:mm", { locale: es })}
                                                </time>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{req.asunto}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><User size={12} /> {req.nombre}</span>
                                                <span className="flex items-center gap-1"><Shield size={12} /> {req.tenantId}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all self-center" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Detail Section */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <AnimatePresence mode="wait">
                        {selectedRequest ? (
                            <motion.div
                                key={(selectedRequest as any)._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden sticky top-24"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 flex items-center justify-between">
                                    <h2 className="font-bold text-slate-900 dark:text-white">Detalle de Solicitud</h2>
                                    <button onClick={() => setSelectedRequest(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <ExternalLink size={16} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Usuario</p>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                                {selectedRequest.nombre[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedRequest.nombre}</p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={10} /> {selectedRequest.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mensaje</p>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800 italic">
                                            "{selectedRequest.mensaje}"
                                        </div>
                                    </div>

                                    {selectedRequest.estado === 'pendiente' ? (
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Responder</p>
                                            <Textarea
                                                value={respuesta}
                                                onChange={e => setRespuesta(e.target.value)}
                                                placeholder="Escribe tu respuesta aquí..."
                                                className="rounded-2xl min-h-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500/20"
                                            />
                                            <Button
                                                onClick={handleRespond}
                                                disabled={isResponding || !respuesta.trim()}
                                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                {isResponding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                Enviar Respuesta
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Respuesta Enviada
                                            </p>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl text-sm text-green-800 dark:text-green-300 border border-green-100 dark:border-green-800/30">
                                                {selectedRequest.respuesta}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 h-[500px] flex flex-col items-center justify-center text-center p-8">
                                <LifeBuoy size={48} className="text-slate-200 mb-4" />
                                <h3 className="text-slate-400 font-bold">Selecciona una solicitud</h3>
                                <p className="text-slate-400 text-xs mt-2">Haz clic en un mensaje de la lista para ver el detalle y responder.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
