"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { useSession } from "next-auth/react";

interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    const [loading, setLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: "",
        nombre: "",
        apellidos: "",
        puesto: "",
        rol: "TECNICO" as "SUPER_ADMIN" | "ADMIN" | "TECNICO" | "INGENIERIA",
        tenantId: "", // Solo para SuperAdmins
        activeModules: ["TECHNICAL", "RAG"] as string[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setTempPassword(data.temp_password);
                toast({
                    title: "Usuario creado",
                    description: `Usuario ${formData.email} creado exitosamente`,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.error || "No se pudo crear el usuario",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Error al crear usuario",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (tempPassword) {
            onSuccess();
        }
        setFormData({
            email: "",
            nombre: "",
            apellidos: "",
            puesto: "",
            rol: "TECNICO",
            tenantId: "",
            activeModules: ["TECHNICAL", "RAG"],
        });
        setTempPassword(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Completa los datos del nuevo usuario. Se generará una contraseña temporal.
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-900 mb-2">
                                ✓ Usuario creado exitosamente
                            </p>
                            <p className="text-sm text-green-700 mb-3">
                                Contraseña temporal generada:
                            </p>
                            <div className="bg-white border border-green-300 rounded p-3">
                                <code className="text-lg font-mono font-bold text-green-900">
                                    {tempPassword}
                                </code>
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                                ⚠️ Comunica esta contraseña al usuario. No se volverá a mostrar.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellidos">Apellidos *</Label>
                                <Input
                                    id="apellidos"
                                    required
                                    value={formData.apellidos}
                                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label htmlFor="tenantId" className="text-teal-600 font-bold">Tenant ID (Global Admin Only) *</Label>
                                <Input
                                    id="tenantId"
                                    placeholder="ej: tenant-123"
                                    required
                                    value={formData.tenantId}
                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                    className="border-teal-200 focus:ring-teal-500"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="puesto">Puesto</Label>
                            <Input
                                id="puesto"
                                placeholder="Ej: Técnico de Mantenimiento"
                                value={formData.puesto}
                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rol">Rol *</Label>
                            <Select
                                value={formData.rol}
                                onValueChange={(value: any) => setFormData({ ...formData, rol: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>}
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="TECNICO">Técnico</SelectItem>
                                    <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <Label className="text-sm font-bold">Módulos Habilitados</Label>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="mod-technical"
                                        checked={formData.activeModules.includes("TECHNICAL")}
                                        onCheckedChange={(checked) => {
                                            const modules = checked
                                                ? [...formData.activeModules, "TECHNICAL"]
                                                : formData.activeModules.filter(m => m !== "TECHNICAL");
                                            setFormData({ ...formData, activeModules: modules });
                                        }}
                                    />
                                    <label htmlFor="mod-technical" className="text-sm font-medium leading-none cursor-pointer">
                                        Acceso Técnico (Pedidos/Casos)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="mod-rag"
                                        checked={formData.activeModules.includes("RAG")}
                                        onCheckedChange={(checked) => {
                                            const modules = checked
                                                ? [...formData.activeModules, "RAG"]
                                                : formData.activeModules.filter(m => m !== "RAG");
                                            setFormData({ ...formData, activeModules: modules });
                                        }}
                                    />
                                    <label htmlFor="mod-rag" className="text-sm font-medium leading-none cursor-pointer">
                                        Módulo RAG (Conocimiento)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Usuario
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
