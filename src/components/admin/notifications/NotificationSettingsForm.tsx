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

const EVENT_LABELS: Record<string, { label: string, icon: any }> = {
    SYSTEM: { label: 'Mensajes del Sistema', icon: FileText },
    ANALYSIS_COMPLETE: { label: 'Análisis Finalizados', icon: CheckCircle },
    RISK_ALERT: { label: 'Alertas de Riesgo', icon: ShieldAlert },
    BILLING_EVENT: { label: 'Facturación y Cuotas', icon: CreditCard },
    SECURITY_ALERT: { label: 'Seguridad y Accesos', icon: Bell }
};

export function NotificationSettingsForm() {
    const { toast } = useToast();
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
                    title: "Configuración guardada",
                    description: "Tus preferencias de notificación se han actualizado correctamente.",
                });
            } else {
                toast({
                    title: "Error al guardar",
                    description: "No se pudo actualizar la configuración. Revisa los datos.",
                    variant: "destructive"
                });
            }
        } catch (e) {
            toast({
                title: "Error de conexión",
                description: "Ocurrió un problema al intentar conectar con el servidor.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando configuración...</div>;
    if (!config) return <div>Error al cargar configuración</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Preferencias de Comunicación</h2>
                    <p className="text-slate-500">Configura cómo y qué notificaciones recibe tu organización.</p>
                </div>
                <Button onClick={saveConfig} disabled={saving} className="gap-2">
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración General</CardTitle>
                    <CardDescription>Ajustes globales para el sistema de notificaciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 max-w-md">
                        <Label htmlFor="fallback">Email de Fallback (Default)</Label>
                        <Input
                            id="fallback"
                            type="email"
                            value={config.fallbackEmail || ''}
                            onChange={(e) => setConfig({ ...config, fallbackEmail: e.target.value })}
                            placeholder="alertas@tuempresa.com"
                        />
                        <p className="text-[10px] text-slate-400">Este email recibirá las notificaciones si no hay destinatarios específicos definidos para un evento.</p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="SYSTEM" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    {Object.keys(EVENT_LABELS).map(type => {
                        const Icon = EVENT_LABELS[type].icon;
                        return (
                            <TabsTrigger key={type} value={type} className="gap-2 px-4">
                                <Icon size={16} />
                                <span className="hidden md:inline">{EVENT_LABELS[type].label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {Object.keys(EVENT_LABELS).map(type => (
                    <TabsContent key={type} value={type} className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Ajustes de Canal */}
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        Canales y Estado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>Evento Activo</Label>
                                            <p className="text-[10px] text-slate-500">Habilitar/deshabilitar este tipo de notificaciones.</p>
                                        </div>
                                        <Switch
                                            checked={config.events[type]?.enabled}
                                            onCheckedChange={(checked) => handleToggleEvent(type, checked)}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <Label className="text-xs uppercase text-slate-400">Canales habilitados</Label>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" />
                                                <span className="text-sm">Correo Electrónico</span>
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
                                                <span className="text-sm">Notificaciones In-App (Campana)</span>
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
                                        <CardTitle className="text-sm font-bold">Destinatarios Específicos</CardTitle>
                                        <CardDescription className="text-xs">Quién recibirá alertas para este evento concreto.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="nuevo@email.com"
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
                                                <TableHead>Email</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {config.events[type]?.recipients.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-6 text-slate-400 text-xs italic">
                                                        No hay destinatarios específicos. Se usará el fallback del tenant o el usuario afectado.
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
                                    <CardTitle className="text-sm font-bold">Inyección de Texto (Opcional)</CardTitle>
                                    <CardDescription className="text-xs">
                                        Este texto aparecerá en el pie de los correos de este tipo para todos tus usuarios.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="Ej: Recuerda subir el comprobante de pago a la carpeta compartida de RRHH."
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
