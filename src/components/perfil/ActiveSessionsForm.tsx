"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, XCircle, LogOut, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Session {
    _id: string;
    ip: string;
    userAgent: string;
    device: {
        browser?: string;
        os?: string;
        type: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
    };
    location?: {
        city?: string;
        country?: string;
    };
    lastActive: string;
    createdAt: string;
    isCurrent: boolean;
}

export function ActiveSessionsForm() {
    const { toast } = useToast();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/auth/perfil/sesiones');
            const data = await res.json();
            if (data.sessions) setSessions(data.sessions);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevoke = async (id: string) => {
        setRevokingId(id);
        try {
            const res = await fetch(`/api/auth/perfil/sesiones?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Sesión cerrada", description: "El dispositivo ha sido desconectado." });
                setSessions(prev => prev.filter(s => s._id !== id));
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOthers = async () => {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión en todos los demás dispositivos?')) return;
        try {
            const res = await fetch('/api/auth/perfil/sesiones?all=true', { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Limpieza completada", description: "Se han cerrado todas las sesiones excepto la actual." });
                setSessions(prev => prev.filter(s => s.isCurrent));
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error" });
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'MOBILE': return <Smartphone size={18} />;
            case 'TABLET': return <Tablet size={18} />;
            default: return <Monitor size={18} />;
        }
    };

    if (loading) return <div className="animate-pulse h-40 bg-slate-50 rounded-xl" />;

    return (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck size={16} className="text-teal-600" />
                        Sesiones Activas
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Dispositivos que tienen acceso actualmente a tu cuenta.
                    </CardDescription>
                </div>
                {sessions.length > 1 && (
                    <Button variant="outline" size="sm" className="text-xs h-8 text-red-500 hover:text-red-600" onClick={handleRevokeOthers}>
                        Cerrar todas las demás
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sessions.map((session) => (
                        <div key={session._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-lg ${session.isCurrent ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {getDeviceIcon(session.device.type)}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">
                                            {session.device.browser || 'Navegador desconocido'} en {session.device.os || 'OS desconocido'}
                                        </p>
                                        {session.isCurrent && (
                                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[9px] h-4">
                                                Sesión Actual
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} /> {session.ip}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!session.isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-500 h-8 w-8"
                                    onClick={() => handleRevoke(session._id)}
                                    disabled={revokingId === session._id}
                                >
                                    {revokingId === session._id ? (
                                        <div className="h-4 w-4 animate-spin border-2 border-slate-300 border-t-slate-600 rounded-full" />
                                    ) : (
                                        <XCircle size={18} />
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
