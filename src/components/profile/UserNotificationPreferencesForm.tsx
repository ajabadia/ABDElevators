"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Bell, Save, ShieldAlert, FileText, CheckCircle, CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface UserPreference {
    type: string;
    email: boolean;
    inApp: boolean;
}

const EVENT_LABELS: Record<string, { labelKey: string, icon: any }> = {
    SYSTEM: { labelKey: 'events.system', icon: FileText },
    ANALYSIS_COMPLETE: { labelKey: 'events.analysisComplete', icon: CheckCircle },
    RISK_ALERT: { labelKey: 'events.riskAlert', icon: ShieldAlert },
    BILLING_EVENT: { labelKey: 'events.billingEvent', icon: CreditCard },
    SECURITY_ALERT: { labelKey: 'events.securityAlert', icon: Lock }
};

interface UserData {
    notificationPreferences?: UserPreference[];
}

export function UserNotificationPreferencesForm() {
    const t = useTranslations('profile.notifications');
    const tCommon = useTranslations('common');
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Obtenemos los datos extendidos del perfil
        fetch('/api/auth/perfil')
            .then(res => res.json())
            .then(data => {
                const existing = data.user?.notificationPreferences || [];
                // Aseguramos que todos los tipos estén en el estado local
                const fullPrefs = Object.keys(EVENT_LABELS).map(type => {
                    const found = existing.find((p: UserPreference) => p.type === type);
                    return found || { type, email: true, inApp: true };
                });
                setPreferences(fullPrefs);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleToggle = (type: string, channel: 'email' | 'inApp', enabled: boolean) => {
        setPreferences(prev => prev.map(p =>
            p.type === type ? { ...p, [channel]: enabled } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/auth/perfil/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences })
            });

            if (res.ok) {
                toast({
                    title: t('successTitle'),
                    description: t('successDescription'),
                });
            } else {
                toast({
                    variant: "destructive",
                    title: tCommon('error'),
                    description: t('errorSave'),
                });
            }
        } catch (e) {
            toast({
                variant: "destructive",
                title: tCommon('connectionError'),
                description: t('errorConnection'),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="animate-pulse h-40 bg-slate-50 rounded-xl" />;

    return (
        <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="w-[40%]">{t('eventType')}</TableHead>
                            <TableHead className="text-center">
                                <span className="flex items-center justify-center gap-2">
                                    <Mail size={14} className="text-slate-400" /> {t('email')}
                                </span>
                            </TableHead>
                            <TableHead className="text-center">
                                <span className="flex items-center justify-center gap-2">
                                    <Bell size={14} className="text-slate-400" /> {t('inApp')}
                                </span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {preferences.map((p) => {
                            const info = EVENT_LABELS[p.type];
                            const Icon = info.icon;
                            return (
                                <TableRow key={p.type} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                <Icon size={16} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                    {t(info.labelKey)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{p.type}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={p.email}
                                            onCheckedChange={(v) => handleToggle(p.type, 'email', v)}
                                            className="mx-auto"
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={p.inApp}
                                            onCheckedChange={(v) => handleToggle(p.type, 'inApp', v)}
                                            className="mx-auto"
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                        <Save size={16} />
                        {saving ? tCommon('saving') : t('saveBtn')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
