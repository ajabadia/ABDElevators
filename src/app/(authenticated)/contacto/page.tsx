'use client';

import React, { useState } from 'react';
import {
    LifeBuoy,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    MessageSquare,
    Mail,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

export default function ContactPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Form State
    const [form, setForm] = useState({
        asunto: '',
        mensaje: '',
        prioridad: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: session?.user?.name || 'Usuario',
                    email: session?.user?.email || '',
                    ...form
                })
            });

            if (res.ok) {
                setSent(true);
                toast({
                    title: "Solicitud enviada",
                    description: "Un administrador revisará tu consulta lo antes posible."
                });
            } else {
                throw new Error('Error al enviar la solicitud');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                <LifeBuoy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Soporte Técnico
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg ml-1">
                            ¿Necesitas ayuda con un pedido o tienes una duda técnica? Estamos aquí para ayudarte.
                        </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                        <div className="text-xs">
                            <p className="font-bold text-slate-900 dark:text-white">Admin Team</p>
                            <p className="text-slate-500">Promedio de respuesta: &lt; 2h</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <AnimatePresence mode="wait">
                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">¡Mensaje Enviado!</h2>
                                    <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                        Tu solicitud ha sido registrada correctamente. Recibirás una notificación in-app y un email cuando sea respondida.
                                    </p>
                                    <Button
                                        onClick={() => setSent(false)}
                                        variant="outline"
                                        className="rounded-xl px-8"
                                    >
                                        Enviar otro mensaje
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    onSubmit={handleSubmit}
                                    className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Asunto</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <Input
                                                    required
                                                    value={form.asunto}
                                                    onChange={e => setForm({ ...form, asunto: e.target.value })}
                                                    placeholder="Ej: Dudas con el motor del pedido #1234"
                                                    className="rounded-xl h-12 pl-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Mensaje Detallado</label>
                                            <div className="relative group">
                                                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <Textarea
                                                    required
                                                    value={form.mensaje}
                                                    onChange={e => setForm({ ...form, mensaje: e.target.value })}
                                                    placeholder="Describe tu problema o pregunta con el máximo detalle posible..."
                                                    className="rounded-xl min-h-[160px] pl-12 pt-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Prioridad</label>
                                            <div className="flex gap-3">
                                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, prioridad: p })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider",
                                                            form.prioridad === p
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105"
                                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-400"
                                                        )}
                                                    >
                                                        {p === 'LOW' ? 'Baja' : p === 'MEDIUM' ? 'Media' : 'Alta'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl transition-all active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                        Enviar Solicitud
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Info Section */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <LifeBuoy size={120} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Información de Seguridad</h3>
                            <ul className="space-y-4 text-slate-400 text-sm">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="text-teal-400 shrink-0" size={18} />
                                    <span>Tu solicitud será visible solo para administradores autorizados.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="text-teal-400 shrink-0" size={18} />
                                    <span>Se registra automáticamente tu tenant context ({session?.user?.tenantId}).</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="text-teal-400 shrink-0" size={18} />
                                    <span>La trazabilidad (Audit Trail) está activa para esta operación.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-3xl">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed font-medium">
                                    Para incidencias críticas que bloqueen la producción, selecciona prioridad <strong>Alta</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
