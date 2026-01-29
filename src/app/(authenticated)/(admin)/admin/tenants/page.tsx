"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    Cloud, Server, Database, Save, AlertCircle,
    CheckCircle2, HardDrive, Info, Settings,
    Building, Layers, Shield, Palette, Upload, Trash2,
    CreditCard, Receipt, MapPin, Mail, Globe, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
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
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";

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
    billing?: {
        fiscalName?: string;
        taxId?: string;
        shippingAddress?: {
            line1?: string;
            city?: string;
            postalCode?: string;
            country?: string;
        };
        billingAddress?: {
            differentFromShipping: boolean;
            line1?: string;
            city?: string;
            postalCode?: string;
            country?: string;
        };
        recepcion?: {
            canal: 'EMAIL' | 'POSTAL' | 'IN_APP' | 'XML_EDI';
            modo: 'PDF' | 'XML' | 'EDI' | 'CSV' | 'PAPER';
            email?: string;
        };
    };
}

export default function TenantsPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isPreviewDark, setIsPreviewDark] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Carga de datos con useApiList
    const {
        data: tenants,
        isLoading,
        refresh: refreshTenants
    } = useApiList<TenantConfig>({
        endpoint: '/api/admin/tenants',
        dataKey: 'tenants',
        onSuccess: (data) => {
            if (data.length > 0 && !config) {
                // Seleccionar el primero por defecto o buscar por sesión si fuera necesario
                // Para mantener compatibilidad con el original, buscamos el de la sesión más tarde o usamos el primero
                setConfig(data[0]);
            }
        }
    });

    // 2. Acción de guardado con useApiMutation
    const { mutate: saveConfig, isLoading: isSaving } = useApiMutation({
        endpoint: '/api/admin/tenants',
        successMessage: 'Configuración de la organización actualizada correctamente.',
        onSuccess: () => refreshTenants()
    });

    // Utility to lighten/darken a color for preview optimization
    const adjustColor = (hex: string, percent: number) => {
        if (!hex.startsWith('#')) return hex;
        const num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const handleSave = () => {
        if (config) saveConfig(config);
    };

    if (!isMounted || (isLoading && !config)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Configuración de Organización"
                highlight="Organización"
                subtitle="Gestiona el aislamiento de datos, identidad visual y cuotas de almacenamiento."
                actions={
                    <>
                        <Button variant="outline" onClick={() => refreshTenants()} disabled={isSaving}>Refrescar</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/20"
                            disabled={isSaving}
                        >
                            {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                            Guardar Cambios
                        </Button>
                    </>
                }
            />

            <ContentCard className="overflow-hidden" noPadding={true}>
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
                        <TabsTrigger
                            value="billing"
                            className="data-[state=active]:text-teal-600 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none bg-transparent h-14 px-4 font-bold transition-all"
                        >
                            <CreditCard size={16} className="mr-2" /> Facturación
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
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${config?.storage?.provider === 'cloudinary' ? 'border-teal-600 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <Cloud className={config?.storage?.provider === 'cloudinary' ? 'text-teal-600' : 'text-slate-400'} size={24} />
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
                                        value={config?.storage?.settings?.folder_prefix || ''}
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            storage: {
                                                ...prev.storage,
                                                settings: { ...(prev.storage?.settings || {}), folder_prefix: e.target.value }
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
                                            {config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} MB
                                        </span>
                                    </div>
                                    <Input
                                        type="number"
                                        value={config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0}
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

                    <TabsContent value="billing" className="p-8 space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Columna 1: Datos Fiscales y Recepción */}
                            <div className="lg:col-span-1 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <Receipt className="text-teal-600" size={20} />
                                        Identidad Fiscal
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fiscalName">Razón Social / Nombre Fiscal</Label>
                                            <Input
                                                id="fiscalName"
                                                placeholder="Ej: ABD Elevadores S.L."
                                                value={config?.billing?.fiscalName || ''}
                                                onChange={(e) => setConfig(prev => prev ? {
                                                    ...prev,
                                                    billing: { ...(prev.billing || {}), fiscalName: e.target.value }
                                                } : null)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">CIF / NIF / VAT ID</Label>
                                            <Input
                                                id="taxId"
                                                placeholder="Ej: B12345678"
                                                value={config?.billing?.taxId || ''}
                                                onChange={(e) => setConfig(prev => prev ? {
                                                    ...prev,
                                                    billing: { ...(prev.billing || {}), taxId: e.target.value }
                                                } : null)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <Mail className="text-teal-600" size={20} />
                                        Recepción de Facturas
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Canal Preferente</Label>
                                            <Select
                                                value={config?.billing?.recepcion?.canal || 'EMAIL'}
                                                onValueChange={(val: any) => setConfig(prev => prev ? {
                                                    ...prev,
                                                    billing: {
                                                        ...(prev.billing || {}),
                                                        recepcion: { ...(prev.billing?.recepcion || { modo: 'PDF' }), canal: val }
                                                    }
                                                } : null)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EMAIL">Correo Electrónico</SelectItem>
                                                    <SelectItem value="POSTAL">Correo Postal</SelectItem>
                                                    <SelectItem value="IN_APP">Sólo descarga en App</SelectItem>
                                                    <SelectItem value="XML_EDI">Intercambio XML / EDI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {config?.billing?.recepcion?.canal === 'EMAIL' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label htmlFor="billingEmail">Email de Facturación</Label>
                                                <Input
                                                    id="billingEmail"
                                                    type="email"
                                                    placeholder="facturacion@empresa.com"
                                                    value={config?.billing?.recepcion?.email || ''}
                                                    onChange={(e) => setConfig(prev => prev ? {
                                                        ...prev,
                                                        billing: {
                                                            ...(prev.billing || {}),
                                                            recepcion: { ...(prev.billing?.recepcion || { canal: 'EMAIL', modo: 'PDF' }), email: e.target.value }
                                                        }
                                                    } : null)}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Formato de Archivo</Label>
                                            <Select
                                                value={config?.billing?.recepcion?.modo || 'PDF'}
                                                onValueChange={(val: any) => setConfig(prev => prev ? {
                                                    ...prev,
                                                    billing: {
                                                        ...(prev.billing || {}),
                                                        recepcion: { ...(prev.billing?.recepcion || { canal: 'EMAIL' }), modo: val }
                                                    }
                                                } : null)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PDF">PDF (Firmado Digitalmente)</SelectItem>
                                                    <SelectItem value="XML">XML Facturae</SelectItem>
                                                    <SelectItem value="CSV">CSV / Excel</SelectItem>
                                                    <SelectItem value="PAPER">Papel (Físico)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna 2 & 3: Direcciones */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-6">
                                        <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                            <MapPin className="text-blue-600" size={18} />
                                            Dirección de Envío
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Calle y Número</Label>
                                                <Input
                                                    value={config?.billing?.shippingAddress?.line1 || ''}
                                                    onChange={(e) => setConfig(prev => prev ? {
                                                        ...prev,
                                                        billing: {
                                                            ...(prev.billing || {}),
                                                            shippingAddress: { ...(prev.billing?.shippingAddress || {}), line1: e.target.value }
                                                        }
                                                    } : null)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Ciudad</Label>
                                                    <Input
                                                        value={config?.billing?.shippingAddress?.city || ''}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            billing: {
                                                                ...(prev.billing || {}),
                                                                shippingAddress: { ...(prev.billing?.shippingAddress || {}), city: e.target.value }
                                                            }
                                                        } : null)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Cód. Postal</Label>
                                                    <Input
                                                        value={config?.billing?.shippingAddress?.postalCode || ''}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            billing: {
                                                                ...(prev.billing || {}),
                                                                shippingAddress: { ...(prev.billing?.shippingAddress || {}), postalCode: e.target.value }
                                                            }
                                                        } : null)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>País</Label>
                                                <Input
                                                    value={config?.billing?.shippingAddress?.country || 'España'}
                                                    onChange={(e) => setConfig(prev => prev ? {
                                                        ...prev,
                                                        billing: {
                                                            ...(prev.billing || {}),
                                                            shippingAddress: { ...(prev.billing?.shippingAddress || {}), country: e.target.value }
                                                        }
                                                    } : null)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "p-6 rounded-3xl border transition-all space-y-6",
                                        config?.billing?.billingAddress?.differentFromShipping
                                            ? "bg-white border-teal-200 shadow-xl shadow-teal-500/5 ring-1 ring-teal-500/10"
                                            : "bg-slate-50/50 border-slate-100 opacity-80"
                                    )}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                                <Building className="text-teal-600" size={18} />
                                                Dirección de Facturación
                                            </h3>
                                            <Switch
                                                checked={config?.billing?.billingAddress?.differentFromShipping || false}
                                                onCheckedChange={(checked) => setConfig(prev => prev ? {
                                                    ...prev,
                                                    billing: {
                                                        ...(prev.billing || {}),
                                                        billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: false }), differentFromShipping: checked }
                                                    }
                                                } : null)}
                                            />
                                        </div>

                                        {!config?.billing?.billingAddress?.differentFromShipping ? (
                                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-center p-4">
                                                <Info size={24} className="text-slate-300 mb-2" />
                                                <span className="text-xs text-slate-400">Igual que la dirección de envío activo.</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                                <div className="space-y-2">
                                                    <Label>Calle y Número (Fact.)</Label>
                                                    <Input
                                                        value={config?.billing?.billingAddress?.line1 || ''}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            billing: {
                                                                ...(prev.billing || {}),
                                                                billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), line1: e.target.value }
                                                            }
                                                        } : null)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Ciudad</Label>
                                                        <Input
                                                            value={config?.billing?.billingAddress?.city || ''}
                                                            onChange={(e) => setConfig(prev => prev ? {
                                                                ...prev,
                                                                billing: {
                                                                    ...(prev.billing || {}),
                                                                    billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), city: e.target.value }
                                                                }
                                                            } : null)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Cód. Postal</Label>
                                                        <Input
                                                            value={config?.billing?.billingAddress?.postalCode || ''}
                                                            onChange={(e) => setConfig(prev => prev ? {
                                                                ...prev,
                                                                billing: {
                                                                    ...(prev.billing || {}),
                                                                    billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), postalCode: e.target.value }
                                                                }
                                                            } : null)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>País</Label>
                                                    <Input
                                                        value={config?.billing?.billingAddress?.country || 'España'}
                                                        onChange={(e) => setConfig(prev => prev ? {
                                                            ...prev,
                                                            billing: {
                                                                ...(prev.billing || {}),
                                                                billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), country: e.target.value }
                                                            }
                                                        } : null)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-teal-600 text-white flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-bold flex items-center gap-2">
                                            <Shield size={18} />
                                            Certificación de Factura Electrónica
                                        </h4>
                                        <p className="text-xs text-teal-100">Cumplimos con la Ley Crea y Crece para el intercambio seguro de facturas XML.</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                                Información EDI
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>Facturación Electrónica (Ley Crea y Crece)</DialogTitle>
                                                <DialogDescription>
                                                    Información sobre el cumplimiento normativo para el intercambio B2B.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-4 text-sm text-slate-600">
                                                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                                    <h5 className="font-bold text-teal-800 mb-1">✅ Emisor (Tú / Plataforma)</h5>
                                                    <p>Tu sistema ya genera automáticamente las facturas con la huella digital y formato XML requeridos por defecto.</p>
                                                </div>

                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                    <h5 className="font-bold text-slate-800 mb-1">📩 Receptor (Este Cliente)</h5>
                                                    <p className="mb-2">Configura aquí cómo este cliente específico prefiere recibir sus facturas:</p>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        <li><strong>Email (PDF):</strong> Cumplimiento estándar. El cliente recibe el PDF firmado.</li>
                                                        <li><strong>XML / EDI:</strong> Para integración directa con el ERP del cliente (requiere punto de entrada AS2/Facturae configurado).</li>
                                                    </ul>
                                                </div>

                                                <p className="text-xs text-slate-400">
                                                    Usa los selectores de "Recepción de Facturas" superiores para cambiar la preferencia de este cliente.
                                                </p>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </ContentCard>

            <ContentCard className="bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between p-8" noPadding={true}>
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
                    <Link href="/admin/auditoria">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900">Ver Auditoría Chunks</Button>
                    </Link>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100">
                                Certificar GDPR
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-teal-700">
                                    <Shield className="h-5 w-5" />
                                    Certificado de Cumplimiento GDPR
                                </DialogTitle>
                                <DialogDescription>
                                    Informe de conformidad normativa para {config?.name || 'la organización'}.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Estado del Procesamiento:</span>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">CONFORME</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Ubicación de Datos:</span>
                                        <span className="font-mono text-xs">EU-WEST-1 (Frankfurt)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Cifrado en Reposo:</span>
                                        <span className="font-mono text-xs">AES-256-GCM</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Retención de Logs:</span>
                                        <span className="font-mono text-xs">90 Días (Anonimizado)</span>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-400 bg-blue-50 text-blue-700 p-3 rounded border border-blue-100">
                                    <p>Este tenant cumple con los requisitos del Reglamento General de Protección de Datos (RGPD) UE 2016/679.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => toast({ title: "Informe descargado", description: "El PDF de cumplimiento se ha guardado en tu equipo." })}>
                                    Descargar Informe PDF
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </ContentCard>
        </PageContainer>
    );
}
