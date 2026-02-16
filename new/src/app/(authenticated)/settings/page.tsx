"use client";

import { useState, useEffect } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, User, Settings as SettingsIcon, Shield, History } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { resetOnboarding, isCompleted } = useOnboarding();
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleResetTour = async () => {
        setIsSyncing(true);
        try {
            await resetOnboarding();
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
                <p className="text-muted-foreground italic">
                    Gestiona tu perfil, preferencias de interfaz y opciones de gobernanza.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Categorías (Sidebar visual) */}
                <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-2 bg-accent">
                        <User className="h-4 w-4" /> Perfil de Usuario
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <SettingsIcon className="h-4 w-4" /> Interfaz y Pantalla
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Shield className="h-4 w-4" /> Seguridad y Permisos
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <History className="h-4 w-4" /> Historial de Cambios
                    </Button>
                </div>

                {/* Contenido Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Sección: Experiencia de Usuario */}
                    <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                Experiencia de Usuario
                            </CardTitle>
                            <CardDescription>
                                Personaliza cómo interactúas con la plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-accent/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Tour de Bienvenida</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Vuelve a ver la guía interactiva por todas las herramientas.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleResetTour}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    Reiniciar Tour
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Ayuda Contextual</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Mostrar sugerencias y atajos mientras navegas.
                                    </p>
                                </div>
                                <Switch checked={true} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección: Información de Gobernanza (Placeholder) */}
                    <Card className="border-muted bg-card/40">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                Trazabilidad y Auditoría
                            </CardTitle>
                            <CardDescription>
                                Transparencia total sobre los cambios estructurales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded border border-dashed border-muted-foreground/30">
                                Tu cuenta cuenta con registro de auditoría de grado bancario.
                                Todos los cambios en configuraciones son registrados con firma de usuario y correlation_id.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
