'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProfileStore } from '@/store/profile-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserRole } from '@/types/roles';
import { Save, Loader2 } from 'lucide-react';

export function ProfileForm() {
    const t = useTranslations('profile.form');
    const { user, updateProfile } = useProfileStore();
    const [isSaving, setIsSaving] = useState(false);

    const isPrivileged = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user?.role as UserRole);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            jobTitle: formData.get('jobTitle') as string,
        };

        try {
            const success = await updateProfile(data);
            if (success) {
                toast.success(t('successTitle'), {
                    description: t('successDescription')
                });
            } else {
                toast.error(t('errorUpdate'), {
                    description: t('errorDescription')
                });
            }
        } catch (error) {
            toast.error(t('errorUpdate'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName">{t('firstName')}</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        defaultValue={user?.firstName}
                        required
                        placeholder="Your first name"
                        disabled={!isPrivileged}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        defaultValue={user?.lastName}
                        required
                        placeholder="Your last name"
                        disabled={!isPrivileged}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        value={user?.email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900 border-dashed"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="jobTitle">{t('role')}</Label>
                        {!isPrivileged && (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 border-slate-200">
                                {t('readOnly')}
                            </Badge>
                        )}
                    </div>
                    <Input
                        id="jobTitle"
                        name="jobTitle"
                        defaultValue={user?.jobTitle}
                        placeholder="Job title or specialty"
                        disabled={!isPrivileged}
                    />
                </div>
            </div>

            {!isPrivileged && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-bold">{t('note')}:</span> {t('unprivilegedNotice')}
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                    type="submit"
                    disabled={isSaving || !isPrivileged}
                    className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('saveBtn')}
                </Button>
            </div>
        </form>
    );
}
