"use client";

import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useResetExperience } from '@/hooks/useResetExperience';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    RefreshCw,
    User,
    Settings as SettingsIcon,
    Shield,
    History,
    Building2,
    Users,
    MessageSquare,
    Globe,
    Bell,
    Palette,
    Sparkles,
    Eraser
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SettingsPage() {
    const t = useTranslations('settings.page');
    const { data: session } = useSession();
    const { resetOnboarding } = useOnboarding();
    const { resetExperience } = useResetExperience();

    const [isSyncing, setIsSyncing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const isAdmin = session?.user?.role === 'ADMIN' || (session?.user?.role as string) === 'SUPERADMIN';

    const handleResetTour = async () => {
        setIsSyncing(true);
        try {
            await resetOnboarding();
            toast.success("Tour reiniciado");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFullReset = async () => {
        setIsResetting(true);
        try {
            await resetExperience();
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground italic">
                    {t('subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Categorías (Sidebar visual) */}
                <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-2 bg-accent">
                        <User className="h-4 w-4" /> {t('profile')}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <SettingsIcon className="h-4 w-4" /> {t('interface')}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Shield className="h-4 w-4" /> {t('security')}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <History className="h-4 w-4" /> {t('history')}
                    </Button>

                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-primary/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 px-3">
                                Management
                            </p>
                            <Link href="/admin/organizations">
                                <Button variant="ghost" className="w-full justify-start gap-2 text-primary hover:text-primary">
                                    <Building2 className="h-4 w-4" /> Organization
                                </Button>
                            </Link>
                            <Link href="/admin/users">
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Users className="h-4 w-4" /> Users
                                </Button>
                            </Link>
                            <Link href="/admin/prompts">
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <MessageSquare className="h-4 w-4" /> Prompts
                                </Button>
                            </Link>
                            <Link href="/admin/settings/i18n">
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Globe className="h-4 w-4" /> {t('i18n', { defaultValue: 'Internationalization' })}
                                </Button>
                            </Link>
                            <Link href="/admin/settings/notifications">
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <Bell className="h-4 w-4" /> {t('notifications', { defaultValue: 'Notifications' })}
                                </Button>
                            </Link>
                            <Link href="/admin/settings/branding">
                                <Button variant="ghost" className="w-full justify-start gap-2 text-purple-600 hover:text-purple-700">
                                    <Palette className="h-4 w-4" /> {t('branding', { defaultValue: 'Branding' })}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Contenido Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Sección: Experiencia de Usuario */}
                    <Card className="border-primary/20 bg-card/60 backdrop-blur-sm shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                {t('onboarding.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('onboarding.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-accent/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Tour de Bienvenida</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Vuelve a ver la introducción guiada de la plataforma.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleResetTour}
                                    disabled={isSyncing}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? "Reiniciando..." : "Reiniciar Tour"}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2">
                                        Limpiar Ayudas y Encuestas
                                        <Badge variant="secondary" className="text-[10px] font-bold">RECOMENDADO</Badge>
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Resetea el modo guía, las micro-encuestas y las alertas descartadas.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleFullReset}
                                    disabled={isResetting}
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Eraser className={`h-4 w-4 ${isResetting ? 'animate-pulse' : ''}`} />
                                    {isResetting ? "Limpiando..." : "Restablecer Ayudas"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección: Seguridad (MFA Enforcement) */}
                    <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {t('securitySection.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('securitySection.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-accent/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('mfa.label')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('mfa.description')}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {t('mfa.active')}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground italic">
                                        Enforced by Organization
                                    </span>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded border border-dashed border-muted-foreground/30">
                                <p>🔒 <strong>Normativa de Acceso:</strong> MFA obligatorio para todo acceso técnico o administrativo según política SOC2 del Tenant.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección: Trazabilidad (Placeholder) */}
                    <Card className="border-muted bg-card/40">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Historial y Auditoría
                            </CardTitle>
                            <CardDescription>
                                Registro de accesos y cambios en tu perfil.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded border border-dashed border-muted-foreground/30">
                                El registro de auditoría de grado bancario está activo. Todas las acciones están firmadas digitalmente.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
