"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Space, SpaceInvitation } from "@/lib/schemas/spaces";
import { toast } from "sonner";
import { Loader2, UserPlus, Shield, Trash2, Mail, Clock, Check, X, Users } from "lucide-react";
import { format } from "date-fns";

interface SpaceManagementModalProps {
    space: Space | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * 🌌 SpaceManagementModal (Phase 125.2)
 * Comprehensive management UI for spaces: General, Collaboration, Invitations & Config.
 */
export function SpaceManagementModal({ space, isOpen, onClose, onSuccess }: SpaceManagementModalProps) {
    const [activeTab, setActiveTab] = useState("general");
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Space>>({});
    const [invitations, setInvitations] = useState<SpaceInvitation[]>([]);
    const [newInvite, setNewInvite] = useState({ email: "", role: "VIEWER" as const });

    useEffect(() => {
        if (space) {
            setFormData(space);
            fetchInvitations();
        }
    }, [space]);

    const fetchInvitations = async () => {
        if (!space?._id) return;
        try {
            const res = await fetch(`/api/admin/spaces/${space._id}/invitations`);
            const data = await res.json();
            if (data.success) setInvitations(data.invitations);
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        }
    };

    const handleUpdate = async () => {
        if (!space?._id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/spaces/${space._id}`, {
                method: "PATCH",
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Espacio actualizado correctamente");
                onSuccess();
            } else {
                toast.error(data.message || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvite = async () => {
        if (!space?._id || !newInvite.email) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/spaces/${space._id}/invitations`, {
                method: "POST",
                body: JSON.stringify(newInvite),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Invitación enviada");
                setNewInvite({ email: "", role: "VIEWER" });
                fetchInvitations();
            } else {
                toast.error(data.message || "Error al enviar invitación");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!space?._id) return;
        try {
            const res = await fetch(`/api/admin/spaces/${space._id}/invitations?inviteId=${inviteId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Invitación revocada");
                fetchInvitations();
            }
        } catch (error) {
            toast.error("Error al revocar");
        }
    };

    if (!space) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Gestionar Espacio: {space.name}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="px-6 border-b">
                        <TabsList className="h-10 bg-transparent gap-2">
                            <TabsTrigger value="general" className="data-[state=active]:bg-muted">General</TabsTrigger>
                            <TabsTrigger value="collaboration" className="data-[state=active]:bg-muted">Colaboradores</TabsTrigger>
                            <TabsTrigger value="invitations" className="data-[state=active]:bg-muted">Invitaciones</TabsTrigger>
                            <TabsTrigger value="config" className="data-[state=active]:bg-muted">Configuración</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="general" className="mt-0 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Espacio</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Descripción</Label>
                                <Textarea
                                    id="desc"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="collaboration" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                {formData.collaborators?.map((collab, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {collab.userId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{collab.userId}</span>
                                                <span className="text-[10px] text-muted-foreground">Miembro desde {format(new Date(collab.joinedAt), "MMM yyyy")}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">{collab.role}</Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {(!formData.collaborators || formData.collaborators.length === 0) && (
                                    <div className="py-12 text-center border-2 border-dashed rounded-lg">
                                        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-muted-foreground">No hay colaboradores externos todavía.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="invitations" className="mt-0 space-y-6">
                            <div className="p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-950/30">
                                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                    <UserPlus className="w-4 h-4 text-orange-600" />
                                    Invitar nuevo colaborador
                                </h4>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="email@empresa.com"
                                        className="h-9"
                                        value={newInvite.email}
                                        onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                                    />
                                    <Button size="sm" className="h-9 px-4" onClick={handleSendInvite} disabled={isLoading || !newInvite.email}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Invitaciones Pendientes ({invitations.length})</h4>
                                {invitations.map((invite) => (
                                    <div key={invite._id?.toString()} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invite.email}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expira {format(new Date(invite.expiresAt), "dd/MM/yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={invite.status === 'PENDING' ? "secondary" : "outline"} className="text-[10px] h-5">
                                                {invite.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRevokeInvite(invite._id?.toString()!)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="config" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium">Estado del Espacio</span>
                                        <span className="text-xs text-muted-foreground">Desactivar un espacio impide el acceso a sus documentos.</span>
                                    </div>
                                    <Button
                                        variant={formData.isActive ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    >
                                        {formData.isActive ? "Desactivar" : "Activar"}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-destructive">Eliminar Espacio</span>
                                        <span className="text-xs text-muted-foreground text-destructive/70">Esta acción no se puede deshacer de forma sencilla.</span>
                                    </div>
                                    <Button variant="destructive" size="sm">
                                        Eliminar permanentemente
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="p-6 pt-2 border-t bg-muted/30">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleUpdate} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
