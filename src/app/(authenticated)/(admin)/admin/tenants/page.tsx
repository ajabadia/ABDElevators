"use client";

import { useState, useEffect } from "react";
import {
    Cloud, Server, Database, Save, AlertCircle,
    CheckCircle2, HardDrive, Info, Settings,
    Building, Layers, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logEventoCliente } from "@/lib/logger-client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TenantConfig {
    tenantId: string;
    name: string;
    industry: 'ELEVATORS' | 'LEGAL' | 'MEDICAL' | 'GENERIC';
    storage: {
        provider: 'cloudinary' | 'gdrive' | 's3';
        settings: {
            folder_prefix?: string;
            bucket?: string;
            region?: string;
        };
        quota_bytes: number;
    };
}

export default function TenantsPage() {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // En un MVP multi-tenant real, aquí listaríamos tenants. 
    // Por ahora, gestionamos el tenant de la sesión actual (o 'default').
    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            // Obtenemos la lista de tenants
            const res = await fetch('/api/admin/tenants');
            const data = await res.json();

            if (data.success && data.tenants.length > 0) {
                // Tomamos el primero por ahora o el que coincida con la sesión
                setConfig(data.tenants[0]);
            } else {
                // Si no hay ninguno, mostramos uno vacío o default
                setConfig({
                    tenantId: 'abd-elevators-main',
                    name: 'ABD Elevators Official',
                    industry: 'ELEVATORS',
                    storage: {
                        provider: 'cloudinary',
                        settings: {
                            folder_prefix: 'abd-rag-platform/elevators'
                        },
                        quota_bytes: 100 * 1024 * 1024 // 100MB
                    }
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cargar la configuración del tenant",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Configuración guardada",
                    description: "Los cambios se han aplicado correctamente.",
                });
                logEventoCliente({
                    nivel: 'INFO',
                    origen: 'UI_TENANTS',
                    accion: 'SAVE_CONFIG',
                    mensaje: `Configuración guardada para ${config.tenantId}`,
                    correlacion_id: config.tenantId
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error al guardar",
                description: error.message || "No se pudo actualizar la configuración",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Configuración de Organización</h2>
                    <p className="text-slate-500 mt-1">Gestiona el aislamiento de datos, cuotas de almacenamiento y contexto industrial.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchConfig} disabled={isSaving}>Descartar</Button>
                    <Button
                        onClick={handleSave}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/20"
                        disabled={isSaving}
                    >
                        {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Perfil y General */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg overflow-hidden">
                        <div className="h-2 bg-teal-600" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="text-teal-600" size={20} />
                                Perfil del Tenant
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                        <SelectItem value="GENERIC">Genérico / Otros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-slate-900 text-white">
                        <CardHeader>
                            <CardTitle className="text-teal-400 flex items-center gap-2">
                                <Info size={20} />
                                Estado del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-300 text-sm">
                            <div className="flex justify-between items-center">
                                <span>Aislamiento de Chunks</span>
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">Activo</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Cifrado en Reposo</span>
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">AES-256</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Multi-región</span>
                                <Badge variant="outline" className="text-slate-500 border-slate-700 font-normal">No Disponible</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Central y Derecha: Storage Config */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="text-teal-600" size={20} />
                                        Configuración de Almacenamiento
                                    </CardTitle>
                                    <CardDescription>Define dónde se guardan los archivos físicos y los límites de cuotas.</CardDescription>
                                </div>
                                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">
                                    Trial Plan
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="provider" className="w-full">
                                <TabsList className="mb-6 bg-slate-100 p-1">
                                    <TabsTrigger value="provider" className="gap-2">
                                        <Cloud size={16} /> Proveedor
                                    </TabsTrigger>
                                    <TabsTrigger value="limits" className="gap-2">
                                        <HardDrive size={16} /> Límites y Cuotas
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="provider" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div
                                            onClick={() => setConfig(prev => prev ? { ...prev, storage: { ...prev.storage, provider: 'cloudinary' } } : null)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${config?.storage.provider === 'cloudinary' ? 'border-teal-600 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <Cloud className={config?.storage.provider === 'cloudinary' ? 'text-teal-600' : 'text-slate-400'} />
                                            <h4 className="font-bold mt-2">Cloudinary</h4>
                                            <p className="text-[10px] text-slate-500">Optimización de PDFs y CDN global incluido.</p>
                                        </div>
                                        <div
                                            className="p-4 rounded-xl border-2 border-slate-100 opacity-50 cursor-not-allowed bg-slate-50/50"
                                            title="Próximamente"
                                        >
                                            <Server className="text-slate-400" />
                                            <h4 className="font-bold mt-2 text-slate-400">AWS S3</h4>
                                            <p className="text-[10px] text-slate-400">Escalabilidad masiva empresarial.</p>
                                        </div>
                                        <div
                                            className="p-4 rounded-xl border-2 border-slate-100 opacity-50 cursor-not-allowed bg-slate-50/50"
                                            title="Próximamente"
                                        >
                                            <Database className="text-slate-400" />
                                            <h4 className="font-bold mt-2 text-slate-400">Google Drive</h4>
                                            <p className="text-[10px] text-slate-400">Integración nativa con Workspace.</p>
                                        </div>
                                    </div>

                                    {config?.storage.provider === 'cloudinary' && (
                                        <div className="space-y-4 p-4 border border-teal-100 rounded-xl bg-teal-50/30 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className="bg-teal-600">Configuración Activa</Badge>
                                                <span className="text-xs text-slate-500">Las credenciales se toman del .env global para este plan.</span>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="folder_prefix">Prefijo de Carpeta / Namespace</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="folder_prefix"
                                                        value={config?.storage.settings.folder_prefix}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            storage: {
                                                                ...prev.storage,
                                                                settings: { ...prev.storage.settings, folder_prefix: e.target.value }
                                                            }
                                                        } : null)}
                                                        placeholder="e.g. tenants/tenant-name"
                                                    />
                                                    <Button variant="outline" className="shrink-0"><Settings size={16} /></Button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">Este prefijo asegura que los archivos de este tenant no se mezclen con otros en el cloud.</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="limits" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <Label>Cuota de Almacenamiento (MB)</Label>
                                                <p className="text-xs text-slate-500">Espacio máximo permitido para documentos originales.</p>
                                            </div>
                                            <span className="text-2xl font-bold font-outfit text-teal-600">
                                                {config ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} MB
                                            </span>
                                        </div>
                                        <Input
                                            type="number"
                                            value={config ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0}
                                            onChange={(e) => {
                                                const mb = parseInt(e.target.value) || 0;
                                                setConfig(prev => prev ? {
                                                    ...prev,
                                                    storage: {
                                                        ...prev.storage,
                                                        quota_bytes: mb * 1024 * 1024
                                                    }
                                                } : null);
                                            }}
                                            className="font-bold text-lg"
                                        />

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4">
                                            <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 text-sm">Aviso de cuota</h5>
                                                <p className="text-xs text-slate-500">Si el tenant excede este límite, el sistema denegará nuevas subidas de archivos hasta que se libere espacio o se aumente la cuota.</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="text-teal-600" size={20} />
                                Módulos y Funcionalidades
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-medium">Búsqueda Semántica RAG</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">Incluido</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-medium">Análisis GenAI (Gemini)</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">Incluido</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                                        <span className="text-sm font-medium">Multi-idioma Avanzado</span>
                                    </div>
                                    <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">Locked</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                                        <span className="text-sm font-medium">Custom Prompts por Tenant</span>
                                    </div>
                                    <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">En Desarrollo</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">Seguridad y Cumplimiento</h4>
                        <p className="text-sm text-slate-500">Este tenant cumple con los estándares GDPR y SOC2 (Simulado).</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2">
                    Descargar Informe de Seguridad
                    <CheckCircle2 size={16} className="text-emerald-500" />
                </Button>
            </div>
        </div>
    );
}
