'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Key } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PasswordForm() {
    const t = useTranslations('profile.security.password');
    const tCommon = useTranslations('common');
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            toast({
                title: tCommon('error'),
                description: t('matchError'),
                variant: 'destructive',
            });
            setSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                toast({
                    title: t('successTitle'),
                    description: t('successDesc'),
                });
                (e.target as HTMLFormElement).reset();
            } else {
                const data = await res.json();
                throw new Error(data.error || t('updateError'));
            }
        } catch (error: any) {
            toast({
                title: tCommon('error'),
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Key className="text-teal-600" size={20} />
                {t('title')}
            </h3>

            <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('currentLabel')}</Label>
                    <Input id="currentPassword" name="currentPassword" type="password" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('newLabel')}</Label>
                    <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('confirmLabel')}</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving} variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('submitBtn')}
                </Button>
            </div>
        </form>
    );
}
