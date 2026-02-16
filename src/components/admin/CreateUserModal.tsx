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
import { Loader2, Copy, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles";

interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    const [loading, setLoading] = useState(false);
    const [activationLink, setActivationLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        jobTitle: "",
        role: UserRole.TECHNICAL as UserRole,
        tenantId: "", // Solo para SuperAdmins
        activeModules: ["TECHNICAL", "RAG"] as string[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setActivationLink(data.activationLink);
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
        if (activationLink) {
            onSuccess();
        }
        setFormData({
            email: "",
            firstName: "",
            lastName: "",
            jobTitle: "",
            role: UserRole.TECHNICAL,
            tenantId: "",
            activeModules: ["TECHNICAL", "RAG"],
        });
        setActivationLink(null);
        setCopied(false);
        onClose();
    };

    const handleCopy = () => {
        if (activationLink) {
            navigator.clipboard.writeText(activationLink);
            setCopied(true);
            toast({
                title: "Enlace copiado",
                description: "El enlace de activación ha sido copiado al portapapeles",
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Completa los datos del nuevo usuario. Se generará un enlace de activación seguro.
                    </DialogDescription>
                </DialogHeader>

                {activationLink ? (
                    <div className="space-y-4">
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-teal-900 mb-2">
                                ✓ Usuario creado exitosamente
                            </p>
                            <p className="text-sm text-teal-700 mb-3">
                                Enlace de activación generado para el usuario:
                            </p>
                            <div className="flex gap-2 bg-white border border-teal-300 rounded p-3 items-center">
                                <code className="flex-1 text-xs font-mono break-all text-teal-900">
                                    {activationLink}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopy}
                                    className="shrink-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-teal-600 mt-3">
                                ⚠️ Comparte este enlace con el usuario para que active su cuenta y elija su contraseña.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full bg-teal-600 hover:bg-teal-700">
                            Finalizar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input
                                id="jobTitle"
                                placeholder="Ej: Maintenance Technician"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isSuperAdmin && <SelectItem value={UserRole.SUPER_ADMIN}>Super Administrador</SelectItem>}
                                    <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                                    <SelectItem value={UserRole.TECHNICAL}>Técnico</SelectItem>
                                    <SelectItem value={UserRole.ENGINEERING}>Ingeniería</SelectItem>
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
