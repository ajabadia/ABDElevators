
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';

interface GeneralTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function GeneralTab({ config, setConfig }: GeneralTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">ID de Organización</Label>
                    <Input
                        id="tenantId"
                        value={config?.tenantId}
                        disabled
                        className="bg-slate-50 font-mono text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input
                        id="name"
                        value={config?.name}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="industry">Industria / Dominio</Label>
                    <Select
                        value={config?.industry}
                        onValueChange={(val: any) => setConfig(prev => prev ? { ...prev, industry: val } : null)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona industria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ELEVATORS">Elevadores y Elevación</SelectItem>
                            <SelectItem value="LEGAL">Legal / Despachos</SelectItem>
                            <SelectItem value="MEDICAL">Médico / Salud</SelectItem>
                            <SelectItem value="IT">Tecnología / IT</SelectItem>
                            <SelectItem value="GENERIC">Genérico / Otros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                    <h4 className="text-primary font-bold flex items-center gap-2">
                        <Info size={18} />
                        Estado de Cumplimiento
                    </h4>
                    <div className="space-y-4 text-sm text-slate-300">
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span>Aislamiento de Datos</span>
                            <Badge className="bg-primary/20 text-primary border-primary/30">Activo</Badge>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span>Región de Datos</span>
                            <span className="text-white">EU-West (Zaragoza/Frankfurt)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Cifrado</span>
                            <Badge className="bg-primary/20 text-primary border-primary/30">AES-256</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
