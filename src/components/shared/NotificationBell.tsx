'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '@/lib/schemas';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchNotifications();
        // Polling cada 60 segundos (opcional, para demo)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] })
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => (n as any)._id !== id));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        const ids = notifications.map(n => (n as any)._id);
        if (ids.length === 0) return;

        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (res.ok) {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'RISK_ALERT': return 'text-rose-500';
            case 'ANALYSIS_COMPLETE': return 'text-blue-500';
            case 'SECURITY_ALERT': return 'text-amber-500';
            case 'BILLING_EVENT': return 'text-purple-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative group"
            >
                <Bell size={20} className={cn(notifications.length > 0 && "animate-tada")} />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        ></div>
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    Notificaciones
                                    {notifications.length > 0 && (
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                                            {notifications.length}
                                        </span>
                                    )}
                                </h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Marcar todas como leídas
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-400 text-xs">Cargando...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                                            <Bell className="text-slate-300 dark:text-slate-600" size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Todo al día</p>
                                        <p className="text-xs text-slate-500">No tienes notificaciones pendientes.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.map((n) => (
                                            <div
                                                key={(n as any)._id}
                                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn("mt-1 shrink-0 w-2 h-2 rounded-full", getIcon(n.type))} />
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                            {n.title}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center justify-between pt-1">
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {mounted ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es }) : 'Cargando...'}
                                                            </span>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {n.link && (
                                                                    <Link
                                                                        href={n.link}
                                                                        onClick={() => {
                                                                            markAsRead((n as any)._id);
                                                                            setIsOpen(false);
                                                                        }}
                                                                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 transition-all"
                                                                    >
                                                                        <ExternalLink size={12} />
                                                                    </Link>
                                                                )}
                                                                <button
                                                                    onClick={() => markAsRead((n as any)._id)}
                                                                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-green-500 transition-all"
                                                                >
                                                                    <Check size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest"
                                    >
                                        Cerrar panel
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
