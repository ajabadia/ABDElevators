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
import { Loader2, Mail, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { useApiMutation } from "@/hooks/useApiMutation";

interface InviteUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    const [invited, setInvited] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: "",
        rol: "TECNICO" as "SUPER_ADMIN" | "ADMIN" | "TECNICO" | "INGENIERIA",
        tenantId: "", // Solo para SuperAdmins
    });

    const { mutate: inviteUser, isLoading: loading } = useApiMutation({
        endpoint: '/api/admin/usuarios/invite',
        method: 'POST',
        onSuccess: () => {
            setInvited(true);
            toast({
                title: "Invitación enviada",
                description: `Se ha enviado un email a ${formData.email}`,
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inviteUser(formData);
    };

    const handleClose = () => {
        if (invited) {
            onSuccess();
        }
        setFormData({
            email: "",
            rol: "TECNICO",
            tenantId: "",
        });
        setInvited(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px] border-teal-100">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-teal-600" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold text-slate-800">Invitar Colaborador</DialogTitle>
                    <DialogDescription className="text-center text-slate-500">
                        Envía una invitación segura por correo electrónico. El usuario podrá configurar su propio nombre y contraseña.
                    </DialogDescription>
                </DialogHeader>

                {invited ? (
                    <div className="space-y-6 pt-4">
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-100 rounded-full mb-3">
                                <Mail className="h-5 w-5 text-teal-600" />
                            </div>
                            <h3 className="text-lg font-bold text-teal-900 mb-1">¡Invitación Enviada!</h3>
                            <p className="text-sm text-teal-700">
                                Hemos enviado un enlace de registro seguro a<br />
                                <strong className="text-teal-900">{formData.email}</strong>
                            </p>
                            <p className="text-xs text-teal-600 mt-4 italic">
                                El enlace es válido por 7 días.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full bg-teal-600 hover:bg-teal-700">
                            Entendido
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@empresa.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 border-slate-200 focus:ring-teal-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rol" className="text-slate-700 font-semibold">Rol Asignado</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                                <Select
                                    value={formData.rol}
                                    onValueChange={(value: any) => setFormData({ ...formData, rol: value })}
                                >
                                    <SelectTrigger className="pl-10 border-slate-200 focus:ring-teal-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>}
                                        <SelectItem value="ADMIN">Administrador de Organización</SelectItem>
                                        <SelectItem value="TECNICO">Técnico Operativo</SelectItem>
                                        <SelectItem value="INGENIERIA">Ingeniería de Proyectos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label htmlFor="tenantId" className="text-orange-600 font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Tenant ID (Solo SuperAdmin)
                                </Label>
                                <Input
                                    id="tenantId"
                                    placeholder="ej: tenant-xxxx"
                                    required
                                    value={formData.tenantId}
                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                    className="border-orange-200 focus:ring-orange-500 bg-orange-50/30"
                                />
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={handleClose} className="text-slate-500">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 min-w-[140px] shadow-lg shadow-teal-600/20">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Invitación"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
