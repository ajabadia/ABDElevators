
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Send,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'TECHNICAL',
        priority: 'MEDIUM'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.description) {
            toast({ title: "Error", description: "Completa los campos obligatorios", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/soporte/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "Ticket Creado",
                    description: `Referencia: ${data.ticket.ticketNumber}. Te hemos enviado un email de confirmación.`
                });
                router.push('/soporte'); // Volver al listado
            } else {
                throw new Error('Error al crear');
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo crear el ticket. Inténtalo de nuevo.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/soporte" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis tickets
            </Link>

            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    Abrir Nueva Incidencia
                </h1>
                <p className="text-slate-500">
                    Describe tu problema detalladamente para que podamos ayudarte mejor.
                </p>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
                <CardContent className="p-8 pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <select
                                    id="category"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="TECHNICAL">Soporte Técnico</option>
                                    <option value="BILLING">Facturación y Pagos</option>
                                    <option value="ACCESS">Acceso de Usuarios</option>
                                    <option value="FEATURE_REQUEST">Sugerencia</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <select
                                    id="priority"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="LOW">Baja - Consulta general</option>
                                    <option value="MEDIUM">Media - Problema menor</option>
                                    <option value="HIGH">Alta - Bloqueo parcial</option>
                                    <option value="CRITICAL">Crítica - Sistema caído</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Asunto <span className="text-red-500">*</span></Label>
                            <Input
                                id="subject"
                                placeholder="Ej: Error al subir PDF..."
                                className="h-12 rounded-xl"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción Detallada <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="description"
                                placeholder="Describe los pasos para reproducir el problema..."
                                className="min-h-[200px] rounded-xl resize-y p-4 leading-relaxed"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sé lo más específico posible para agilizar la resolución.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Link href="/soporte">
                                <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl">Cancelar</Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                Enviar Ticket
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
