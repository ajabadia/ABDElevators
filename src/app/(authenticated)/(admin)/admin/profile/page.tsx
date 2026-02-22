"use client";

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useProfileStore } from '@/store/profile-store';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { ContentCard } from '@/components/ui/content-card';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { UserNotificationPreferencesForm } from '@/components/profile/UserNotificationPreferencesForm';
import { ActiveSessionsForm } from '@/components/profile/ActiveSessionsForm';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { UserCircle, Shield, Bell, Smartphone, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { PasswordForm } from '@/components/profile/PasswordForm';
import { MfaSettingsForm } from '@/components/profile/MfaSettingsForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FeatureFlags } from '@/lib/feature-flags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
    const t = useTranslations('profile.page');
    const tMfa = useTranslations('profile.security.mfa');
    const { user, loading, fetchProfile } = useProfileStore();
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showMfaForm, setShowMfaForm] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            fetchProfile();
        }
    }, [user, fetchProfile]);

    if (!mounted) {
        return null; // Evita mismatch de hidratación con IDs de Radix y FeatureFlags
    }

    if (loading && !user) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                icon={<UserCircle className="w-6 h-6 text-teal-600" />}
            >
                {user && (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            {user.rol}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('memberSince')} {user.createdAt ? formatDate(new Date(user.createdAt)) : '-'}
                        </span>
                    </div>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lateral: Foto y Resumen */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <ContentCard
                        title={t('avatar')}
                        icon={<UserCircle className="w-5 h-5" />}
                    >
                        <div className="flex flex-col items-center py-4">
                            <ProfilePhotoUpload
                                currentPhotoUrl={user?.foto_url}
                                onUploadSuccess={() => fetchProfile()}
                            />
                            <div className="mt-4 text-center">
                                <h3 className="font-medium">{user?.nombre} {user?.apellidos}</h3>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                    </ContentCard>

                    <ContentCard
                        title={t('security')}
                        subtitle={t('securitySubtitle')}
                        icon={<Shield className="w-5 h-5" />}
                    >
                        <div className="space-y-4">
                            {/* MFA Mandate Alert (User requirement) */}
                            {!user?.mfaEnabled && (user?.rol === 'ADMIN' || user?.rol === 'SUPER_ADMIN') && FeatureFlags.isEnabled('ENFORCE_MFA_ADMIN') && (
                                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm animate-in zoom-in-95 duration-300">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-xs font-black uppercase tracking-tight text-amber-700">{t('mfaRequiredTitle')}</AlertTitle>
                                    <AlertDescription className="text-[11px] leading-tight">
                                        {t('mfaRequiredDesc')}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium">{t('password')}</span>
                                    <p className="text-[10px] text-muted-foreground italic">{t('recentlyUpdated')}</p>
                                </div>
                                <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs">{t('manage')}</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>{t('password')}</DialogTitle>
                                        </DialogHeader>
                                        <PasswordForm />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-medium">{t('mfa')}</span>
                                        <p className="text-[10px] text-muted-foreground">Seguridad adicional para tu cuenta</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user?.mfaEnabled ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal h-5">
                                                {tMfa('statusEnabled')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal h-5">
                                                {tMfa('statusDisabled')}
                                            </Badge>
                                        )}
                                        <Dialog open={showMfaForm} onOpenChange={show => {
                                            setShowMfaForm(show);
                                            if (!show) fetchProfile();
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 text-xs px-3">
                                                    {user?.mfaEnabled ? t('deactivate') : t('activate')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-950 max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>{t('mfa')}</DialogTitle>
                                                </DialogHeader>
                                                <MfaSettingsForm />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>

                {/* Principal: Formulario y Ajustes */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ContentCard
                        title={t('personalInfo')}
                        subtitle={t('personalInfoSubtitle')}
                        icon={<UserCircle className="w-5 h-5" />}
                    >
                        <ProfileForm />
                    </ContentCard>

                    <ContentCard
                        title={t('notifications')}
                        subtitle={t('notificationPrefsSubtitle')}
                        icon={<Bell className="w-5 h-5" />}
                    >
                        <UserNotificationPreferencesForm />
                    </ContentCard>

                    <ContentCard
                        title={t('sessions')}
                        subtitle={t('securityCenterSubtitle')}
                        icon={<Smartphone className="w-5 h-5" />}
                    >
                        <ActiveSessionsForm />
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
