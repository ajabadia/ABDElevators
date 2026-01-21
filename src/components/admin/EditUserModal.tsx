"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditUserModalProps {
    userId: string | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditUserModal({ userId, open, onClose, onSuccess }: EditUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: "",
        nombre: "",
        apellidos: "",
        puesto: "",
        rol: "TECNICO" as "ADMIN" | "TECNICO" | "INGENIERIA",
        activo: true,
    });

    useEffect(() => {
        if (open && userId) {
            fetchUser();
        }
    }, [open, userId]);

    const fetchUser = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/admin/usuarios/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    email: data.email,
                    nombre: data.nombre,
                    apellidos: data.apellidos,
                    puesto: data.puesto || "",
                    rol: data.rol,
                    activo: data.activo,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cargar el usuario",
                variant: "destructive",
            });
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/usuarios/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast({
                    title: "Usuario actualizado",
                    description: "Los cambios se han guardado correctamente.",
                });
                onSuccess();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.error || "No se pudo actualizar el usuario",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Error al actualizar usuario",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del usuario seleccionado.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-teal-600" size={32} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-nombre">Nombre *</Label>
                                <Input
                                    id="edit-nombre"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-apellidos">Apellidos *</Label>
                                <Input
                                    id="edit-apellidos"
                                    required
                                    value={formData.apellidos}
                                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email (No editable)</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                disabled
                                value={formData.email}
                                className="bg-slate-50 dark:bg-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-puesto">Puesto</Label>
                            <Input
                                id="edit-puesto"
                                placeholder="Ej: Técnico de Mantenimiento"
                                value={formData.puesto}
                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-rol">Rol *</Label>
                            <Select
                                value={formData.rol}
                                onValueChange={(value: any) => setFormData({ ...formData, rol: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="TECNICO">Técnico</SelectItem>
                                    <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="space-y-0.5">
                                <Label>Estado de la Cuenta</Label>
                                <p className="text-xs text-slate-500">
                                    {formData.activo ? "Usuario puede acceder al sistema" : "Acceso deshabilitado"}
                                </p>
                            </div>
                            <Switch
                                checked={formData.activo}
                                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
