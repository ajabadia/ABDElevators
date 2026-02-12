"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApiMutation } from "@/hooks/useApiMutation";
import { SpaceSchema, SpaceType, SpaceVisibility } from "@/lib/schemas/spaces";
import { useI18nToast } from "@/hooks/use-i18n-toast";
import { IndustryType } from "@/lib/schemas/core";

interface CreateSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateSpaceModal({ isOpen, onClose, onSuccess }: CreateSpaceModalProps) {
    const { success: toastSuccess, error: toastError } = useI18nToast();

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        type: "TENANT" as SpaceType,
        visibility: "INTERNAL" as SpaceVisibility,
        industry: undefined as IndustryType | undefined,
        isActive: true,
        config: {
            isDefault: false,
            allowQuickQA: true,
        }
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useApiMutation<any, { success: boolean; spaceId: string }>(
        '/api/admin/spaces',
        'POST'
    );

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: "",
                slug: "",
                description: "",
                type: "TENANT",
                visibility: "INTERNAL",
                industry: undefined,
                isActive: true,
                config: {
                    isDefault: false,
                    allowQuickQA: true,
                }
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            // Validate with Zod before processing
            const result = SpaceSchema.omit({
                _id: true,
                createdAt: true,
                updatedAt: true,
                tenantId: true,
                ownerUserId: true,
                materializedPath: true
            }).safeParse(formData);

            if (!result.success) {
                const newErrors: Record<string, string> = {};
                result.error.issues.forEach(issue => {
                    const path = issue.path.join(".");
                    newErrors[path] = issue.message;
                });
                setErrors(newErrors);
                return;
            }

            await mutation.mutate(result.data);

            toastSuccess("success_key_placeholder", { name: formData.name }); // TODO: add real key to es.json if needed
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toastError("error_key_placeholder");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Espacio</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ej: Departamento de Ventas"
                            value={formData.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    name,
                                    slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                }));
                            }}
                        />
                        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug (Único)</Label>
                        <Input
                            id="slug"
                            placeholder="ej: ventas-global"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        />
                        {errors.slug && <p className="text-xs text-red-500 font-medium">{errors.slug}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Propósito de este espacio..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tipo de Espacio</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as SpaceType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TENANT">Tenant (Compartido)</SelectItem>
                                    <SelectItem value="TEAM">Equipo</SelectItem>
                                    <SelectItem value="PERSONAL">Personal</SelectItem>
                                    <SelectItem value="INDUSTRY">Industria (Cross-Tenant)</SelectItem>
                                    <SelectItem value="GLOBAL">Global (Sistema)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Visibilidad</Label>
                            <Select
                                value={formData.visibility}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, visibility: v as SpaceVisibility }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar visibilidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNAL">Interno (Auth Requerida)</SelectItem>
                                    <SelectItem value="PUBLIC">Público (Solo Lectura)</SelectItem>
                                    <SelectItem value="PRIVATE">Privado (Solo Invitados)</SelectItem>
                                    <SelectItem value="RESTRICTED">Restringido (Admin Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.type === 'INDUSTRY' && (
                        <div className="grid gap-2">
                            <Label>Industria</Label>
                            <Select
                                value={formData.industry}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v as IndustryType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar industria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ELEVATORS">Ascensores</SelectItem>
                                    <SelectItem value="LEGAL">Legal</SelectItem>
                                    <SelectItem value="MEDICAL">Médico</SelectItem>
                                    <SelectItem value="BANKING">Banca</SelectItem>
                                    <SelectItem value="INSURANCE">Seguros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="isDefault"
                            checked={formData.config.isDefault}
                            onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                config: { ...prev.config, isDefault: checked }
                            }))}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="isDefault" className="cursor-pointer">Espacio por Defecto</Label>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Los nuevos assets se asignarán aquí si no se especifica otro.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="allowQuickQA"
                            checked={formData.config.allowQuickQA}
                            onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                config: { ...prev.config, allowQuickQA: checked }
                            }))}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="allowQuickQA" className="cursor-pointer">Permitir Quick Q&A</Label>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Habilita el chat efímero sobre documentos en este espacio.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isLoading}>
                            {mutation.isLoading ? "Creando..." : "Crear Espacio"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
