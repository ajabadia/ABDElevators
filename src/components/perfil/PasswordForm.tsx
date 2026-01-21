'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Key } from 'lucide-react';

export function PasswordForm() {
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
                title: 'Error',
                description: 'Las contraseñas no coinciden.',
                variant: 'destructive',
            });
            setSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/cambiar-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                toast({
                    title: 'Contraseña actualizada',
                    description: 'Tu contraseña se ha cambiado correctamente.',
                });
                (e.target as HTMLFormElement).reset();
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error al cambiar contraseña');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
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
                Seguridad
            </h3>

            <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input id="currentPassword" name="currentPassword" type="password" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving} variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Actualizar Contraseña
                </Button>
            </div>
        </form>
    );
}
