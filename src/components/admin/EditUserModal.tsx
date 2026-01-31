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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";

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
        firstName: "",
        lastName: "",
        jobTitle: "",
        role: "TECHNICAL" as "ADMIN" | "TECHNICAL" | "ENGINEERING",
        active: true,
        photoUrl: "",
        photoCloudinaryId: "",
        activeModules: [] as string[],
    });

    useEffect(() => {
        if (open && userId) {
            fetchUser();
        }
    }, [open, userId]);

    const fetchUser = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    jobTitle: data.jobTitle || "",
                    role: data.role,
                    active: data.active,
                    photoUrl: data.photoUrl || "",
                    photoCloudinaryId: data.photoCloudinaryId || "",
                    activeModules: data.activeModules || ["TECHNICAL", "RAG"],
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
            const res = await fetch(`/api/admin/users/${userId}`, {
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
                        <div className="flex justify-center pb-4 border-b">
                            <ProfilePhotoUpload
                                currentPhotoUrl={formData.photoUrl}
                                onUploadSuccess={(url, publicId) => {
                                    setFormData(prev => ({ ...prev, photoUrl: url, photoCloudinaryId: publicId }));
                                }}
                                uploadUrl={`/api/admin/users/${userId}/upload-photo`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-firstName">First Name *</Label>
                                <Input
                                    id="edit-firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-lastName">Last Name *</Label>
                                <Input
                                    id="edit-lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                            <Label htmlFor="edit-jobTitle">Job Title</Label>
                            <Input
                                id="edit-jobTitle"
                                placeholder="Ej: Maintenance Technician"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="TECHNICAL">Técnico</SelectItem>
                                    <SelectItem value="ENGINEERING">Ingeniería</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <Label className="text-sm font-bold">Módulos Habilitados</Label>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-mod-technical"
                                        checked={formData.activeModules.includes("TECHNICAL")}
                                        onCheckedChange={(checked) => {
                                            const modules = checked
                                                ? [...formData.activeModules, "TECHNICAL"]
                                                : formData.activeModules.filter(m => m !== "TECHNICAL");
                                            setFormData({ ...formData, activeModules: modules });
                                        }}
                                    />
                                    <label htmlFor="edit-mod-technical" className="text-sm font-medium leading-none cursor-pointer">
                                        Acceso Técnico (Pedidos/Casos)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-mod-rag"
                                        checked={formData.activeModules.includes("RAG")}
                                        onCheckedChange={(checked) => {
                                            const modules = checked
                                                ? [...formData.activeModules, "RAG"]
                                                : formData.activeModules.filter(m => m !== "RAG");
                                            setFormData({ ...formData, activeModules: modules });
                                        }}
                                    />
                                    <label htmlFor="edit-mod-rag" className="text-sm font-medium leading-none cursor-pointer">
                                        Módulo RAG (Conocimiento)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <div className="space-y-0.5">
                                <Label>Account Status</Label>
                                <p className="text-xs text-slate-500">
                                    {formData.active ? "User can access the system" : "Access disabled"}
                                </p>
                            </div>
                            <Switch
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
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
