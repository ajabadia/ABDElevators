"use client";

import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, User, Settings as SettingsIcon, Shield, History } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
    const t = useTranslations('settings.page');
    const { resetOnboarding } = useOnboarding();
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
                </div>

                {/* Contenido Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Sección: Experiencia de Usuario */}
                    <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                {t('onboarding.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('onboarding.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-accent/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('onboarding.title')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('onboarding.description')}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleResetTour}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? t('onboarding.resetting') : t('onboarding.reset')}
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
                                        {t('mfa.configurable')}
                                    </span>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded border border-dashed border-muted-foreground/30">
                                <p>🔒 <strong>{t('securityPolicy.title')}:</strong> {t('securityPolicy.description')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección: Trazabilidad (Placeholder) */}
                    <Card className="border-muted bg-card/40">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                {t('audit.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('audit.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded border border-dashed border-muted-foreground/30">
                                {t('audit.bankGrade')}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
