'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User as UserIcon } from 'lucide-react';

export function ProfileForm() {
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
                    title: 'Perfil actualizado',
                    description: 'Tus datos se han guardado correctamente.',
                });
                fetchProfile();
            } else {
                throw new Error('Error al actualizar');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el perfil.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

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
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" name="nombre" defaultValue={user?.nombre} required placeholder="Tu nombre" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input id="apellidos" name="apellidos" defaultValue={user?.apellidos} required placeholder="Tus apellidos" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email (No editable)</Label>
                    <Input id="email" value={user?.email} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="puesto">Puesto / Cargo</Label>
                    <Input id="puesto" name="puesto" defaultValue={user?.puesto} placeholder="Ej: Técnico de Mantenimiento" />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>
        </form>
    );
}
