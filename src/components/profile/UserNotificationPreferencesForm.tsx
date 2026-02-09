"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Bell, Save, ShieldAlert, FileText, CheckCircle, CreditCard, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useProfileStore } from '@/store/profile-store';

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

export function UserNotificationPreferencesForm() {
    const t = useTranslations('profile.notifications');
    const { user, loading: profileLoading } = useProfileStore();
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const existing = user.notificationPreferences || [];
            const fullPrefs = Object.keys(EVENT_LABELS).map(type => {
                const found = existing.find((p: UserPreference) => p.type === type);
                return found || { type, email: true, inApp: true };
            });
            setPreferences(fullPrefs);
            setLoading(false);
        } else if (!profileLoading) {
            setLoading(false);
        }
    }, [user, profileLoading]);

    const handleToggle = (type: string, channel: 'email' | 'inApp', enabled: boolean) => {
        setPreferences(prev => prev.map(p =>
            p.type === type ? { ...p, [channel]: enabled } : p
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/auth/profile/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences })
            });

            if (res.ok) {
                // Update local store to reflect changes
                const { updateProfile } = useProfileStore.getState();
                await updateProfile({ notificationPreferences: preferences });

                toast.success(t('successTitle'), {
                    description: t('successDescription'),
                });
            } else {
                toast.error(t('errorSave'));
            }
        } catch (e) {
            toast.error(t('errorConnection'));
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
    );

    return (
        <div className="space-y-0">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                        <TableHead className="w-[40%] text-xs font-bold uppercase tracking-wider">{t('eventType')}</TableHead>
                        <TableHead className="text-center">
                            <span className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <Mail size={14} className="text-teal-600" /> {t('email')}
                            </span>
                        </TableHead>
                        <TableHead className="text-center">
                            <span className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <Bell size={14} className="text-teal-600" /> {t('inApp')}
                            </span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {preferences.map((p) => {
                        const info = EVENT_LABELS[p.type];
                        const Icon = info.icon;
                        return (
                            <TableRow key={p.type} className="group transition-colors border-b border-slate-50 dark:border-slate-900 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                            <Icon size={16} className="text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                {t(info.labelKey)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.type}</p>
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
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    {t('saveBtn')}
                </Button>
            </div>
        </div>
    );
}
