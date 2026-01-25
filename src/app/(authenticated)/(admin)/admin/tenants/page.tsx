"use client";

import { useState, useEffect } from "react";
import {
    Cloud, Server, Database, Save, AlertCircle,
    CheckCircle2, HardDrive, Info, Settings,
    Building, Layers, Shield, Palette, Upload, Trash2
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { logEventoCliente } from "@/lib/logger-client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
    branding?: {
        logo?: { url?: string; publicId?: string };
        favicon?: { url?: string; publicId?: string };
        colors?: {
            primary?: string;
            secondary?: string;
            accent?: string;
            primaryDark?: string;
            accentDark?: string;
        };
        autoDarkMode?: boolean;
        companyName?: string;
    };
}

export default function TenantsPage() {
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewDark, setIsPreviewDark] = useState(false);
    const { toast } = useToast();

    // Utility to lighten/darken a color for preview optimization
    const adjustColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    // En un MVP multi-tenant real, aquí listaríamos tenants. 
    // Por ahora, gestionamos el tenant de la sesión actual (o 'default').
    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            // Obtenemos la lista de tenants
            const res = await fetch('/api/admin/tenants');
            const data = await res.json();

            if (data.success && data.tenants.length > 0) {
                // Buscamos el tenant actual de la sesión, o el primero de la lista
                const session = await fetch('/api/auth/session').then(r => r.json());
                const currentTenantId = session?.user?.tenantId;

                const selected = data.tenants.find((t: any) => t.tenantId === currentTenantId) || data.tenants[0];
                setConfig(selected);
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
            <div className="flex justify-between items-start px-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Configuración de Organización</h2>
                        {config?.tenantId && (
                            <Badge variant="outline" className="mt-1 font-mono text-[10px] bg-slate-100 text-slate-500 border-slate-200">
                                {config.tenantId}
                            </Badge>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">Gestiona el aislamiento de datos, identidad visual y cuotas de almacenamiento.</p>
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

            <Card className="border-none shadow-lg overflow-hidden">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-white dark:bg-slate-900 h-14 px-6 gap-8">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="branding"
                            className="data-[state=active]:text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Identidad y Branding
                        </TabsTrigger>
                        <TabsTrigger
                            value="storage"
                            className="data-[state=active]:text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Almacenamiento
                        </TabsTrigger>
                        <TabsTrigger
                            value="features"
                            className="data-[state=active]:text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            Módulos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="p-8 space-y-8">
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
                                    <h4 className="text-teal-400 font-bold flex items-center gap-2">
                                        <Info size={18} />
                                        Estado de Cumplimiento
                                    </h4>
                                    <div className="space-y-4 text-sm text-slate-300">
                                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                            <span>Aislamiento de Datos</span>
                                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">Activo</Badge>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                            <span>Región de Datos</span>
                                            <span className="text-white">EU-West (Zaragoza/Frankfurt)</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Cifrado</span>
                                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">AES-256</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="branding" className="p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Palette className="text-teal-600" size={24} />
                                        Personalización Visual
                                    </h3>
                                    <p className="text-slate-500">Configura el logotipo y colores que verán tus usuarios en el dashboard y reportes PDF.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-slate-700 font-semibold">Logotipo de Organización</Label>
                                        <div className="flex items-center gap-8 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                            <div className="h-28 w-28 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-xl relative">
                                                {config?.branding?.logo?.url ? (
                                                    <img src={config.branding.logo.url} alt="Logo preview" className="object-contain max-w-[90%] max-h-[90%]" />
                                                ) : (
                                                    <Building size={40} className="text-slate-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id="logo-upload"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file || !config) return;

                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            formData.append('type', 'logo');

                                                            try {
                                                                const res = await fetch(`/api/admin/tenants/${config.tenantId}/branding/upload`, {
                                                                    method: 'POST',
                                                                    body: formData
                                                                });
                                                                const data = await res.json();
                                                                if (data.success) {
                                                                    setConfig({
                                                                        ...config,
                                                                        branding: {
                                                                            ...(config.branding || {}),
                                                                            logo: data.asset
                                                                        }
                                                                    });
                                                                    toast({ title: "Logo actualizado", description: "El branding se ha guardado correctamente." });
                                                                }
                                                            } catch (err) {
                                                                toast({ title: "Error", description: "Fallo al subir el logo", variant: "destructive" });
                                                            }
                                                        }}
                                                    />
                                                    <Button variant="outline" asChild className="cursor-pointer">
                                                        <label htmlFor="logo-upload">
                                                            <Upload size={16} className="mr-2" /> Subir Logo
                                                        </label>
                                                    </Button>
                                                    {config?.branding?.logo?.url && (
                                                        <Button variant="ghost" className="text-destructive hover:bg-destructive/10"
                                                            onClick={() => setConfig(prev => prev ? { ...prev, branding: { ...prev.branding, logo: undefined } } : null)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400">Dimensiones mín: 400x400px. Fondo transparente recomendado (PNG).</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <Switch
                                            id="auto-dark-mode"
                                            checked={config?.branding?.autoDarkMode !== false}
                                            onCheckedChange={(checked) => setConfig(prev => prev ? {
                                                ...prev,
                                                branding: {
                                                    ...(prev.branding || {}),
                                                    autoDarkMode: checked
                                                }
                                            } : null)}
                                        />
                                        <div className="flex flex-col">
                                            <Label htmlFor="auto-dark-mode" className="text-sm font-bold">Modo Oscuro Automático</Label>
                                            <span className="text-[10px] text-slate-500">Calcula automáticamente variantes legibles para el tema oscuro.</span>
                                        </div>
                                    </div>

                                    {config?.branding?.autoDarkMode === false && (
                                        <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-3">
                                                <Label className="text-slate-700 font-semibold">Primario (Dark Mode)</Label>
                                                <div className="flex gap-3">
                                                    <div
                                                        className="w-12 h-12 rounded-xl ring-2 ring-slate-100 shadow-inner shrink-0 cursor-pointer overflow-hidden border-2 border-white"
                                                        style={{ backgroundColor: config?.branding?.colors?.primaryDark || config?.branding?.colors?.primary || '#38bdf8' }}
                                                    >
                                                        <input
                                                            type="color"
                                                            className="opacity-0 w-full h-full cursor-pointer"
                                                            value={config?.branding?.colors?.primaryDark || config?.branding?.colors?.primary || '#38bdf8'}
                                                            onChange={(e) => setConfig(prev => prev ? {
                                                                ...prev,
                                                                branding: {
                                                                    ...(prev.branding || {}),
                                                                    colors: { ...(prev.branding?.colors || {}), primaryDark: e.target.value }
                                                                }
                                                            } : null)}
                                                        />
                                                    </div>
                                                    <Input
                                                        value={config?.branding?.colors?.primaryDark || ''}
                                                        placeholder={config?.branding?.colors?.primary}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            branding: {
                                                                ...(prev.branding || {}),
                                                                colors: { ...(prev.branding?.colors || {}), primaryDark: e.target.value }
                                                            }
                                                        } : null)}
                                                        className="font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-slate-700 font-semibold">Acento (Dark Mode)</Label>
                                                <div className="flex gap-3">
                                                    <div
                                                        className="w-12 h-12 rounded-xl ring-2 ring-slate-100 shadow-inner shrink-0 cursor-pointer overflow-hidden border-2 border-white"
                                                        style={{ backgroundColor: config?.branding?.colors?.accentDark || config?.branding?.colors?.accent || '#60a5fa' }}
                                                    >
                                                        <input
                                                            type="color"
                                                            className="opacity-0 w-full h-full cursor-pointer"
                                                            value={config?.branding?.colors?.accentDark || config?.branding?.colors?.accent || '#60a5fa'}
                                                            onChange={(e) => setConfig(prev => prev ? {
                                                                ...prev,
                                                                branding: {
                                                                    ...(prev.branding || {}),
                                                                    colors: { ...(prev.branding?.colors || {}), accentDark: e.target.value }
                                                                }
                                                            } : null)}
                                                        />
                                                    </div>
                                                    <Input
                                                        value={config?.branding?.colors?.accentDark || ''}
                                                        placeholder={config?.branding?.colors?.accent}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            branding: {
                                                                ...(prev.branding || {}),
                                                                colors: { ...(prev.branding?.colors || {}), accentDark: e.target.value }
                                                            }
                                                        } : null)}
                                                        className="font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Live Preview App</h4>
                                        <div className="flex items-center gap-2 bg-white p-1 rounded-full border shadow-sm">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn("h-7 px-3 rounded-full text-[10px] font-bold", !isPreviewDark ? "bg-slate-900 text-white" : "text-slate-500")}
                                                onClick={() => setIsPreviewDark(false)}
                                            >
                                                CLARO
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn("h-7 px-3 rounded-full text-[10px] font-bold", isPreviewDark ? "bg-slate-900 text-white" : "text-slate-500")}
                                                onClick={() => setIsPreviewDark(true)}
                                            >
                                                OSCURO
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "rounded-2xl shadow-2xl border overflow-hidden scale-90 origin-top transition-colors duration-500",
                                        isPreviewDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                                    )}>
                                        <header className={cn(
                                            "h-12 border-b flex items-center justify-between px-4",
                                            isPreviewDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-6 w-6 rounded flex items-center justify-center overflow-hidden",
                                                    isPreviewDark ? "bg-slate-800" : "bg-slate-100"
                                                )}>
                                                    {config?.branding?.logo?.url ? <img src={config.branding.logo.url} className="object-contain" /> : <Building size={14} className={isPreviewDark ? "text-slate-600" : "text-slate-400"} />}
                                                </div>
                                                <span className="font-bold text-xs" style={{ color: isPreviewDark ? (config?.branding?.colors?.primary ? adjustColor(config.branding.colors.primary, 20) : '#fff') : config?.branding?.colors?.primary }}>
                                                    {config?.name || 'Mi Organización'}
                                                </span>
                                            </div>
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: isPreviewDark ? (config?.branding?.colors?.accent ? adjustColor(config.branding.colors.accent, 15) : '#3b82f6') : config?.branding?.colors?.accent }} />
                                        </header>
                                        <div className="p-6 space-y-4">
                                            <div className="h-3 w-40 rounded" style={{ backgroundColor: isPreviewDark ? (config?.branding?.colors?.primary ? adjustColor(config.branding.colors.primary, 20) : '#fff') : (config?.branding?.colors?.primary || '#0f172a') }} />
                                            <div className="space-y-2">
                                                <div className={cn("h-2 w-full rounded", isPreviewDark ? "bg-slate-800" : "bg-slate-100")} />
                                                <div className={cn("h-2 w-full rounded", isPreviewDark ? "bg-slate-800" : "bg-slate-100")} />
                                                <div className={cn("h-2 w-2/3 rounded", isPreviewDark ? "bg-slate-800" : "bg-slate-100")} />
                                            </div>
                                            <div className="h-10 w-full rounded-lg shadow-sm" style={{ backgroundColor: isPreviewDark ? (config?.branding?.colors?.accent ? adjustColor(config.branding.colors.accent, 15) : '#3b82f6') : (config?.branding?.colors?.accent || '#3b82f6') }} />
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-slate-400">
                                        {isPreviewDark ? "Vista previa en Modo Oscuro (colores auto-optimizados)." : "Vista previa en Modo Claro (colores originales)."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="storage" className="p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <Label className="text-slate-700 font-semibold">Proveedor de Infraestructura</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setConfig(prev => prev ? { ...prev, storage: { ...prev.storage, provider: 'cloudinary' } } : null)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${config?.storage.provider === 'cloudinary' ? 'border-teal-600 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <Cloud className={config?.storage.provider === 'cloudinary' ? 'text-teal-600' : 'text-slate-400'} size={24} />
                                        <h4 className="font-bold mt-2">Cloudinary</h4>
                                        <p className="text-[10px] text-slate-500 mt-1">Óptimo para PDFs e imágenes con CDN.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl border-2 border-slate-100 opacity-50 cursor-not-allowed bg-slate-50/50 relative overflow-hidden group">
                                        <Server className="text-slate-400" size={24} />
                                        <h4 className="font-bold mt-2 text-slate-400">AWS S3</h4>
                                        <div className="absolute top-2 right-2 rotate-12 bg-slate-200 text-slate-500 text-[8px] px-2 py-0.5 rounded-full font-bold">PRÓXIMAMENTE</div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="folder_prefix">Directorio Raíz (Storage Isolation)</Label>
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
                                        className="font-mono text-xs bg-slate-50"
                                    />
                                    <p className="text-[10px] text-slate-400">Determina la carpeta base en el cloud para este tenant.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl border bg-slate-50/30 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <Label className="text-slate-700 font-semibold">Cuota Máxima de Disco</Label>
                                            <p className="text-xs text-slate-500">Límite de documentos procesados.</p>
                                        </div>
                                        <span className="text-3xl font-bold font-outfit text-teal-600">
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
                                        className="text-lg font-bold"
                                    />
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px]">Al superar la cuota, se bloqueará el acceso a nuevas peticiones de análisis.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="features" className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: "Búsqueda Semántica RAG", status: "Active" },
                                { name: "Análisis Inteligente (Gemini)", status: "Active" },
                                { name: "Revisiones de Auditoría", status: "Active" },
                                { name: "White Label Branding", status: "Active" },
                                { name: "Multi-idioma Avanzado", status: "Locked" },
                                { name: "Custom Agents", status: "Planned" }
                            ].map((f) => (
                                <div key={f.name} className={`p-4 border rounded-2xl flex items-center justify-between ${f.status !== 'Active' ? 'opacity-40 grayscale bg-slate-50' : 'bg-white shadow-sm'}`}>
                                    <span className="text-sm font-semibold text-slate-700">{f.name}</span>
                                    {f.status === 'Active' ? (
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <CheckCircle2 size={14} />
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px]">{f.status}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">Centro de Seguridad y Confianza</h4>
                        <p className="text-sm text-slate-500">Aislamiento por Tenant validado mediante auditoría sintética continua.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" className="text-slate-500">Ver Auditoría Chunks</Button>
                    <Button variant="outline" className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100">Certificar GDPR</Button>
                </div>
            </div>
        </div>
    );
}
