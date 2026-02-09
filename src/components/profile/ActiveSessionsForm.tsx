"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, XCircle, ShieldCheck, Clock, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

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
    const t = useTranslations('profile.security.sessions');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/auth/profile/sesiones');
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
            const res = await fetch(`/api/auth/profile/sesiones?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(t('revokeSuccess'), {
                    description: t('revokeDesc')
                });
                setSessions(prev => prev.filter(s => s._id !== id));
            }
        } catch (e) {
            toast.error(t('revokeError'));
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOthers = async () => {
        if (!confirm(t('revokeConfirmOthers'))) return;
        try {
            const res = await fetch('/api/auth/profile/sesiones?all=true', { method: 'DELETE' });
            if (res.ok) {
                toast.success(t('cleanupSuccess'), {
                    description: t('cleanupDesc')
                });
                setSessions(prev => prev.filter(s => s.isCurrent));
            }
        } catch (e) {
            toast.error('Error cleanup sessions');
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'MOBILE': return <Smartphone size={18} />;
            case 'TABLET': return <Tablet size={18} />;
            default: return <Monitor size={18} />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
    );

    return (
        <div className="space-y-4">
            {sessions.length > 1 && (
                <div className="flex justify-end px-4 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50"
                        onClick={handleRevokeOthers}
                    >
                        {t('revokeOthersBtn')}
                    </Button>
                </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                {sessions.map((session) => (
                    <div key={session._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-lg ${session.isCurrent ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                {getDeviceIcon(session.device.type)}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">
                                        {session.device.browser || t('unknownBrowser')} en {session.device.os || t('unknownOs')}
                                    </p>
                                    {session.isCurrent && (
                                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[9px] h-4">
                                            {t('currentBadge')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} /> {session.ip}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true, locale: dateLocale })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!session.isCurrent && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8"
                                onClick={() => handleRevoke(session._id)}
                                disabled={revokingId === session._id}
                            >
                                {revokingId === session._id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <XCircle size={18} />
                                )}
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
