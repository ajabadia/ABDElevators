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
import { Loader2, Shield, User as UserIcon, ShieldAlert, Key, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { PermissionGroup, PermissionPolicy } from "@/lib/schemas";

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

    const [roles, setRoles] = useState<PermissionGroup[]>([]);
    const [policies, setPolicies] = useState<PermissionPolicy[]>([]);

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        jobTitle: "",
        role: "TECHNICAL" as any,
        active: true,
        photoUrl: "",
        photoCloudinaryId: "",
        activeModules: [] as string[],
        permissionGroups: [] as string[],
        permissionOverrides: [] as string[],
    });

    useEffect(() => {
        if (open && userId) {
            fetchUser();
            fetchAvailablePermissions();
        }
    }, [open, userId]);

    const fetchAvailablePermissions = async () => {
        try {
            const [rolesRes, policiesRes] = await Promise.all([
                fetch('/api/admin/permissions/roles'),
                fetch('/api/admin/permissions/policies')
            ]);

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.roles || []);
            }

            if (policiesRes.ok) {
                const data = await policiesRes.json();
                setPolicies(data.policies || []);
            }
        } catch (error) {
            console.error("Error fetching permissions info", error);
        }
    };

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
                    active: data.isActive ?? true,
                    photoUrl: data.photoUrl || "",
                    photoCloudinaryId: data.photoCloudinaryId || "",
                    activeModules: data.activeModules || ["TECHNICAL", "RAG"],
                    permissionGroups: data.permissionGroups || [],
                    permissionOverrides: data.permissionOverrides || [],
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

        // Map internal 'active' to 'isActive' for the API
        const payload = {
            ...formData,
            isActive: formData.active
        };

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

    const toggleGroup = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            permissionGroups: prev.permissionGroups.includes(groupId)
                ? prev.permissionGroups.filter(id => id !== groupId)
                : [...prev.permissionGroups, groupId]
        }));
    };

    const addOverride = (policyId: string) => {
        if (!formData.permissionOverrides.includes(policyId)) {
            setFormData(prev => ({
                ...prev,
                permissionOverrides: [...prev.permissionOverrides, policyId]
            }));
        }
    };

    const removeOverride = (policyId: string) => {
        setFormData(prev => ({
            ...prev,
            permissionOverrides: prev.permissionOverrides.filter(id => id !== policyId)
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-teal-600" />
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription>
                            Gestiona el perfil y los permisos dinámicos de {formData.firstName}.
                        </DialogDescription>
                    </DialogHeader>

                    {fetching ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="animate-spin text-teal-600" size={40} />
                        </div>
                    ) : (
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                                <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none h-12 bg-transparent">General</TabsTrigger>
                                <TabsTrigger value="permissions" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none h-12 bg-transparent">Permisos (Guardian V2)</TabsTrigger>
                            </TabsList>

                            <ScrollArea className="max-h-[60vh]">
                                <TabsContent value="general" className="p-6 space-y-6 mt-0">
                                    <div className="flex justify-center pb-4 border-b border-dashed">
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
                                            <Label htmlFor="edit-firstName">First Name</Label>
                                            <Input
                                                id="edit-firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-lastName">Last Name</Label>
                                            <Input
                                                id="edit-lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email (ReadOnly)</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            disabled
                                            value={formData.email}
                                            className="bg-slate-50 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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
                                            <Label htmlFor="edit-role">Base System Role (Legacy)</Label>
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
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <div className="space-y-0.5">
                                            <Label className="font-bold">Account Status</Label>
                                            <p className="text-xs text-slate-500">
                                                {formData.active ? "Access enabled" : "Access disabled"}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="permissions" className="p-6 space-y-6 mt-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                            <Shield className="w-4 h-4 text-teal-600" />
                                            <h3 className="font-bold text-sm">Tenant Assigned Roles</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {roles.map(role => (
                                                <div
                                                    key={role._id?.toString()}
                                                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer hover:border-teal-500/50 ${formData.permissionGroups.includes(role._id?.toString()) ? 'bg-teal-500/5 border-teal-500/30' : 'bg-transparent border-slate-200 dark:border-slate-800'}`}
                                                    onClick={() => toggleGroup(role._id?.toString())}
                                                >
                                                    <Checkbox
                                                        checked={formData.permissionGroups.includes(role._id?.toString())}
                                                        onCheckedChange={() => toggleGroup(role._id?.toString())}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label className="font-bold text-xs cursor-pointer">{role.name}</Label>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">{role.description || 'Sin descripción'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {roles.length === 0 && (
                                                <div className="col-span-2 py-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                                    No hay roles personalizados definidos para este tenant.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                                            <h3 className="font-bold text-sm">Permission Overrides (Exceptions)</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {formData.permissionOverrides.map(policyId => {
                                                    const policy = policies.find(p => p._id?.toString() === policyId);
                                                    return (
                                                        <Badge key={policyId} variant="secondary" className="pl-2 pr-1 py-1 gap-1 h-7 rounded-lg group">
                                                            <span className="text-[10px] font-bold">{policy?.name || 'Unknown Policy'}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); removeOverride(policyId); }}
                                                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    );
                                                })}
                                                {formData.permissionOverrides.length === 0 && (
                                                    <p className="text-[10px] text-muted-foreground italic">No hay excepciones directas para este usuario.</p>
                                                )}
                                            </div>

                                            <div className="pt-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 block">Añadir Excepción</Label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <Select onValueChange={(val) => addOverride(val)}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Selecciona una política para aplicar como override..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {policies
                                                                .filter(p => !formData.permissionOverrides.includes(p._id?.toString()))
                                                                .map(p => (
                                                                    <SelectItem key={p._id?.toString()} value={p._id?.toString()} className="text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant={p.effect === 'DENY' ? 'destructive' : 'outline'} className="text-[8px] h-4 px-1">{p.effect}</Badge>
                                                                            {p.name}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                                        <Key className="w-4 h-4 text-amber-600 mt-1 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-amber-700">Deny-First Logic</p>
                                            <p className="text-[10px] text-amber-600/80 leading-tight">
                                                Recuerda que las reglas DENY tienen prioridad ante cualquier ALLOW, ya sea por grupo o por excepción directa.
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    )}

                    <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t gap-3 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200 dark:border-slate-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
