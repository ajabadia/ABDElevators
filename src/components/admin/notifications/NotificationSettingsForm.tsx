"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Bell, ShieldAlert, FileText, CreditCard, Save, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { NotificationTypeSchema } from '@/lib/schemas/notifications';

interface EventConfig {
    enabled: boolean;
    channels: string[];
    recipients: string[];
    customNote?: string;
    includeCustomNote?: boolean;
}

interface NotificationConfig {
    tenantId: string;
    events: Record<string, EventConfig>;
    fallbackEmail: string;
}

export function NotificationSettingsForm() {
    const t = useTranslations('admin.notifications.settings');
    const tEvents = useTranslations('admin.notifications.events');
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const getEventMeta = (type: string) => {
        const metas: Record<string, { icon: React.ElementType }> = {
            SYSTEM: { icon: FileText },
            ANALYSIS_COMPLETE: { icon: CheckCircle },
            RISK_ALERT: { icon: ShieldAlert },
            BILLING_EVENT: { icon: CreditCard },
            SECURITY_ALERT: { icon: Bell }
        };
        return metas[type] || { icon: FileText };
    };

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch('/api/admin/notifications/config');
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setConfig(data);
            } catch (err) {
                console.error('[NotificationSettings] Load error:', err);
                toast.error(t('toast.loadError'));
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [t]);

    const handleToggleEvent = (type: string, enabled: boolean) => {
        if (!config) return;
        setConfig({
            ...config,
            events: {
                ...config.events,
                [type]: { ...config.events[type], enabled }
            }
        });
    };

    const handleToggleChannel = (type: string, channel: string, enabled: boolean) => {
        if (!config) return;
        const currentChannels = config.events[type].channels;
        let newChannels = [...currentChannels];
        if (enabled && !newChannels.includes(channel)) {
            newChannels.push(channel);
        } else if (!enabled) {
            newChannels = newChannels.filter(c => c !== channel);
        }

        setConfig({
            ...config,
            events: {
                ...config.events,
                [type]: { ...config.events[type], channels: newChannels }
            }
        });
    };

    const handleAddRecipient = (type: string, email: string) => {
        if (!config || !email || !email.includes('@')) return;
        const currentRecipients = config.events[type].recipients || [];
        if (currentRecipients.includes(email)) return;

        setConfig({
            ...config,
            events: {
                ...config.events,
                [type]: { ...config.events[type], recipients: [...currentRecipients, email] }
            }
        });
    };

    const handleRemoveRecipient = (type: string, email: string) => {
        if (!config) return;
        setConfig({
            ...config,
            events: {
                ...config.events,
                [type]: {
                    ...config.events[type],
                    recipients: config.events[type].recipients.filter(r => r !== email)
                }
            }
        });
    };

    const saveConfig = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/notifications/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast.success(t('toast.success'), {
                    description: t('toast.successDesc'),
                });
            } else {
                throw new Error('Save failed');
            }
        } catch (err: unknown) {
            console.error('[NotificationSettings] Save error:', err);
            toast.error(t('toast.error'), {
                description: t('toast.errorDesc'),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 text-muted-foreground animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">{t('loading')}</p>
        </div>
    );

    if (!config) return (
        <div className="p-8 text-center text-rose-500 border border-rose-200 rounded-3xl bg-rose-50">
            {t('loadError')}
        </div>
    );

    const eventTypes = NotificationTypeSchema.options;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-card p-6 rounded-3xl shadow-sm border border-border/40">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{t('globalConfig')}</h2>
                        <p className="text-sm text-muted-foreground">{t('globalConfigDesc')}</p>
                    </div>
                </div>
                <Button onClick={saveConfig} disabled={saving} className="rounded-xl h-12 px-8 font-bold gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t('saving') : t('save')}
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-lg font-bold">{t('fallbackTitle')}</CardTitle>
                    <CardDescription>{t('fallbackDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-4">
                    <div className="grid gap-3 max-w-md">
                        <Label htmlFor="fallback" className="text-xs font-bold uppercase tracking-wider opacity-60">
                            {t('fallbackLabel')}
                        </Label>
                        <Input
                            id="fallback"
                            type="email"
                            className="rounded-xl h-11 bg-muted/30 border-none focus-visible:ring-primary/20"
                            value={config.fallbackEmail || ''}
                            onChange={(e) => setConfig({ ...config, fallbackEmail: e.target.value })}
                            placeholder="admin@organization.com"
                        />
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue={eventTypes[0]} className="w-full">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1 mb-6">
                    {eventTypes.map(type => {
                        const meta = getEventMeta(type);
                        const Icon = meta.icon;
                        return (
                            <TabsTrigger
                                key={type}
                                value={type}
                                className="gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-bold">{tEvents(type)}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {eventTypes.map(type => (
                    <TabsContent key={type} value={type} className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Canal y Activación */}
                            <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl bg-card">
                                <CardHeader className="px-6 pt-6 pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">
                                        {t('channelsTitle')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <div className="space-y-0.5">
                                            <Label className="font-bold">{t('enabled')}</Label>
                                            <p className="text-[10px] text-muted-foreground">{t('enabledDesc')}</p>
                                        </div>
                                        <Switch
                                            checked={config.events[type]?.enabled}
                                            onCheckedChange={(checked) => handleToggleEvent(type, checked)}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2 px-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">{t('email')}</span>
                                            </div>
                                            <Switch
                                                checked={config.events[type]?.channels.includes('EMAIL')}
                                                onCheckedChange={(checked) => handleToggleChannel(type, 'EMAIL', checked)}
                                                disabled={!config.events[type]?.enabled}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                                    <Bell className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">{t('inApp')}</span>
                                            </div>
                                            <Switch
                                                checked={config.events[type]?.channels.includes('IN_APP')}
                                                onCheckedChange={(checked) => handleToggleChannel(type, 'IN_APP', checked)}
                                                disabled={!config.events[type]?.enabled}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Destinatarios */}
                            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-card">
                                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
                                    <div>
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">{t('recipientsTitle')}</CardTitle>
                                        <CardDescription className="text-xs">{t('recipientsDesc')}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder={t('emailPlaceholder')}
                                            className="h-10 text-xs w-56 rounded-xl bg-muted/30 border-none px-4"
                                            id={`new-email-${type}`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.currentTarget as HTMLInputElement).value;
                                                    handleAddRecipient(type, val);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 rounded-xl shrink-0 shadow-none border border-border/40 bg-card hover:bg-muted text-foreground"
                                            onClick={() => {
                                                const input = document.getElementById(`new-email-${type}`) as HTMLInputElement;
                                                handleAddRecipient(type, input.value);
                                                input.value = '';
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="rounded-2xl border border-border/50 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30 h-10">
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-4">{t('recipientEmail')}</TableHead>
                                                    <TableHead className="text-right pr-4"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {config.events[type]?.recipients.length === 0 ? (
                                                    <TableRow className="border-none">
                                                        <TableCell colSpan={2} className="text-center py-12 text-muted-foreground/60 text-xs italic">
                                                            {t('noSpecificRecipients')}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    config.events[type]?.recipients.map(email => (
                                                        <TableRow key={email} className="hover:bg-muted/10 border-border/50">
                                                            <TableCell className="text-sm pl-4 font-medium">{email}</TableCell>
                                                            <TableCell className="text-right pr-4">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                                                    onClick={() => handleRemoveRecipient(type, email)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notas Personalizadas */}
                            <Card className="lg:col-span-3 border border-dashed border-border/60 bg-muted/10 rounded-3xl shadow-none">
                                <CardHeader className="px-8 flex flex-row items-center justify-between pb-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <div className="p-1 bg-amber-50 dark:bg-amber-900/20 rounded text-amber-600">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            {t('customNote')}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {t('customNoteDescShort')}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <Input
                                        placeholder={t('customNotePlaceholder')}
                                        className="h-12 bg-card rounded-xl border-none shadow-sm px-6"
                                        value={config.events[type]?.customNote || ''}
                                        onChange={(e) => {
                                            setConfig({
                                                ...config,
                                                events: {
                                                    ...config.events,
                                                    [type]: { ...config.events[type], customNote: e.target.value }
                                                }
                                            })
                                        }}
                                    />
                                </CardContent>
                            </Card>

                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
