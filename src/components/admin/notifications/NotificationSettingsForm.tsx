"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Bell, ShieldAlert, FileText, CreditCard, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('admin.notifications.events');
    const tForm = useTranslations('admin.notifications.settings.form');
    const { toast } = useToast();
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const getEventLabel = (type: string) => {
        const labels: Record<string, any> = {
            SYSTEM: { label: t('SYSTEM'), icon: FileText },
            ANALYSIS_COMPLETE: { label: t('ANALYSIS_COMPLETE'), icon: CheckCircle },
            RISK_ALERT: { label: t('RISK_ALERT'), icon: ShieldAlert },
            BILLING_EVENT: { label: t('BILLING_EVENT'), icon: CreditCard },
            SECURITY_ALERT: { label: t('SECURITY_ALERT'), icon: Bell }
        };
        return labels[type] || { label: type, icon: FileText };
    };

    useEffect(() => {
        fetch('/api/admin/notifications/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

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
                toast({
                    title: tForm('saveSuccess'),
                    description: tForm('saveSuccessDesc'),
                });
            } else {
                toast({
                    title: tForm('saveError'),
                    description: tForm('saveErrorDesc'),
                    variant: "destructive"
                });
            }
        } catch (e) {
            toast({
                title: tForm('connectionError'),
                description: tForm('connectionErrorDesc'),
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>{tForm('loading')}</div>;
    if (!config) return <div>{tForm('loadError')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">{tForm('title')}</h2>
                    <p className="text-slate-500">{tForm('subtitle')}</p>
                </div>
                <Button onClick={saveConfig} disabled={saving} className="gap-2">
                    <Save size={18} />
                    {saving ? tForm('saving') : tForm('saveBtn')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{tForm('generalTitle')}</CardTitle>
                    <CardDescription>{tForm('generalDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 max-w-md">
                        <Label htmlFor="fallback">{tForm('fallbackEmail')}</Label>
                        <Input
                            id="fallback"
                            type="email"
                            value={config.fallbackEmail || ''}
                            onChange={(e) => setConfig({ ...config, fallbackEmail: e.target.value })}
                            placeholder={tForm('fallbackPlaceholder')}
                        />
                        <p className="text-[10px] text-slate-400">{tForm('fallbackHelp')}</p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="SYSTEM" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    {Object.keys({ SYSTEM: 1, ANALYSIS_COMPLETE: 1, RISK_ALERT: 1, BILLING_EVENT: 1, SECURITY_ALERT: 1 }).map(type => {
                        const meta = getEventLabel(type);
                        const Icon = meta.icon;
                        return (
                            <TabsTrigger key={type} value={type} className="gap-2 px-4">
                                <Icon size={16} />
                                <span className="hidden md:inline">{meta.label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {Object.keys({ SYSTEM: 1, ANALYSIS_COMPLETE: 1, RISK_ALERT: 1, BILLING_EVENT: 1, SECURITY_ALERT: 1 }).map(type => (
                    <TabsContent key={type} value={type} className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Ajustes de Canal */}
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        {tForm('channelsTitle')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>{tForm('eventActive')}</Label>
                                            <p className="text-[10px] text-slate-500">{tForm('eventActiveDesc')}</p>
                                        </div>
                                        <Switch
                                            checked={config.events[type]?.enabled}
                                            onCheckedChange={(checked) => handleToggleEvent(type, checked)}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <Label className="text-xs uppercase text-slate-400">{tForm('enabledChannels')}</Label>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="text-sm">{tForm('emailChannel')}</span>
                                            </div>
                                            <Switch
                                                checked={config.events[type]?.channels.includes('EMAIL')}
                                                onCheckedChange={(checked) => handleToggleChannel(type, 'EMAIL', checked)}
                                                disabled={!config.events[type]?.enabled}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bell size={16} className="text-slate-400" />
                                                <span className="text-sm">{tForm('inAppChannel')}</span>
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
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold">{tForm('recipientsTitle')}</CardTitle>
                                        <CardDescription className="text-xs">{tForm('recipientsDesc')}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder={tForm('newEmailPlaceholder')}
                                            className="h-8 text-xs w-48"
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
                                            size="sm"
                                            variant="outline"
                                            className="h-8"
                                            onClick={() => {
                                                const input = document.getElementById(`new-email-${type}`) as HTMLInputElement;
                                                handleAddRecipient(type, input.value);
                                                input.value = '';
                                            }}
                                        >
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{tForm('emailCol')}</TableHead>
                                                <TableHead className="text-right">{tForm('actionCol')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {config.events[type]?.recipients.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-6 text-slate-400 text-xs italic">
                                                        {tForm('noRecipients')}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                config.events[type]?.recipients.map(email => (
                                                    <TableRow key={email}>
                                                        <TableCell className="text-sm">{email}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                                onClick={() => handleRemoveRecipient(type, email)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Notas Personalizadas */}
                            <Card className="lg:col-span-3 border-dashed bg-slate-50/50">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">{tForm('customNoteTitle')}</CardTitle>
                                    <CardDescription className="text-xs">
                                        {tForm('customNoteDesc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder={tForm('customNotePlaceholder')}
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
