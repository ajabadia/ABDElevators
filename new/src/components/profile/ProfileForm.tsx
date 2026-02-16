'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function ProfileForm() {
    const t = useTranslations('profile.form');
    const tCommon = useTranslations('common');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/perfil');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            nombre: formData.get('nombre'),
            apellidos: formData.get('apellidos'),
            puesto: formData.get('puesto'),
        };

        try {
            const res = await fetch('/api/auth/perfil', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                toast({
                    title: t('successTitle'),
                    description: t('successDescription'),
                });
                fetchProfile();
            } else {
                throw new Error(t('errorUpdate'));
            }
        } catch (error) {
            toast({
                title: tCommon('error'),
                description: t('errorDescription'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const isPrivileged = user?.rol === 'ADMIN' || user?.rol === 'SUPER_ADMIN';

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="nombre" className="flex items-center justify-between">
                        {t('firstName')}
                        {!isPrivileged && <span className="text-[10px] text-slate-400 font-normal italic">{t('readOnly')}</span>}
                    </Label>
                    <Input
                        id="nombre"
                        name="nombre"
                        defaultValue={user?.name}
                        required
                        placeholder="Tu nombre"
                        disabled={!isPrivileged}
                        className={cn(!isPrivileged && "bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80")}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apellidos" className="flex items-center justify-between">
                        {t('lastName')}
                        {!isPrivileged && <span className="text-[10px] text-slate-400 font-normal italic">{t('readOnly')}</span>}
                    </Label>
                    <Input
                        id="apellidos"
                        name="apellidos"
                        defaultValue={user?.apellidos}
                        required
                        placeholder="Tus apellidos"
                        disabled={!isPrivileged}
                        className={cn(!isPrivileged && "bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80")}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email} disabled className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="puesto" className="flex items-center justify-between">
                        {t('role')}
                        {!isPrivileged && <span className="text-[10px] text-slate-400 font-normal italic">{t('readOnly')}</span>}
                    </Label>
                    <Input
                        id="puesto"
                        name="puesto"
                        defaultValue={user?.puesto}
                        placeholder="Ej: Técnico de Mantenimiento"
                        disabled={!isPrivileged}
                        className={cn(!isPrivileged && "bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80")}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                {!isPrivileged && (
                    <p className="text-xs text-slate-500 max-w-md">
                        <span className="font-bold text-teal-600 mr-1">{t('note')}:</span>
                        {t('unprivilegedNotice')}
                    </p>
                )}
                <div className="flex-1" />
                <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 transition-all font-bold">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {tCommon('save')}
                </Button>
            </div>
        </form>
    );
}
