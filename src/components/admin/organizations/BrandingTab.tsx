
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Loader2, Building, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';

interface BrandingTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function BrandingTab({ config, setConfig }: BrandingTabProps) {
    const { toast } = useToast();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [isPreviewDark, setIsPreviewDark] = useState(false);

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <Palette size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Personalización de Marca</h3>
                        <p className="text-slate-500 text-sm">Define los colores corporativos y activos visuales.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-slate-700 font-semibold">Logotipo de Organización</Label>
                        <div className="flex items-center gap-8 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden group">
                                {isUploadingLogo ? (
                                    <Loader2 className="animate-spin text-teal-600" size={32} />
                                ) : config?.branding?.logo?.url ? (
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

                                            setIsUploadingLogo(true);
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
                                            } finally {
                                                setIsUploadingLogo(false);
                                            }
                                        }}
                                    />
                                    <Label htmlFor="logo-upload" className="cursor-pointer">
                                        <Button variant="outline" size="sm" asChild disabled={isUploadingLogo}>
                                            <span>
                                                {isUploadingLogo ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
                                                Subir Logo
                                                {isUploadingLogo && '...'}
                                            </span>
                                        </Button>
                                    </Label>
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

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <Label className="text-slate-700 font-semibold">Favicon / Icono de Pestaña</Label>
                            <div className="flex items-center gap-8 p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden">
                                    {isUploadingFavicon ? (
                                        <Loader2 className="animate-spin text-teal-600" size={24} />
                                    ) : config?.branding?.favicon?.url ? (
                                        <img src={config.branding.favicon.url} alt="Favicon preview" className="object-contain w-8 h-8" />
                                    ) : (
                                        <Building size={24} className="text-slate-200" /> // Changed from Globe to Building for consistency/availability
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            accept="image/x-icon,image/png,image/svg+xml"
                                            className="hidden"
                                            id="favicon-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !config) return;

                                                setIsUploadingFavicon(true);
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('type', 'favicon');

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
                                                                favicon: data.asset
                                                            }
                                                        });
                                                        toast({ title: "Favicon actualizado", description: "El icono de pestaña se ha guardado correctamente." });
                                                    }
                                                } catch (err) {
                                                    toast({ title: "Error", description: "Fallo al subir el favicon", variant: "destructive" });
                                                } finally {
                                                    setIsUploadingFavicon(false);
                                                }
                                            }}
                                        />
                                        <Label htmlFor="favicon-upload" className="cursor-pointer">
                                            <Button variant="outline" size="sm" asChild disabled={isUploadingFavicon}>
                                                <span>
                                                    {isUploadingFavicon ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                                                    Subir Favicon
                                                </span>
                                            </Button>
                                        </Label>
                                        {config?.branding?.favicon?.url && (
                                            <Button variant="ghost" className="text-destructive h-8 px-2 hover:bg-destructive/10"
                                                onClick={() => setConfig(prev => prev ? { ...prev, branding: { ...prev.branding, favicon: undefined } } : null)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400">Archivos .ico, .png o .svg. Recomendado 32x32px.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-semibold">Color Primario (Light Mode)</Label>
                                <div className="flex gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl ring-2 ring-slate-100 shadow-inner shrink-0 cursor-pointer overflow-hidden border-2 border-white"
                                        style={{ backgroundColor: config?.branding?.colors?.primary || '#0f172a' }}
                                    >
                                        <input
                                            type="color"
                                            className="opacity-0 w-full h-full cursor-pointer"
                                            value={config?.branding?.colors?.primary || '#0f172a'}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                branding: {
                                                    ...(prev.branding || {}),
                                                    colors: { ...(prev.branding?.colors || {}), primary: e.target.value }
                                                }
                                            } : null)}
                                        />
                                    </div>
                                    <Input
                                        value={config?.branding?.colors?.primary || ''}
                                        placeholder="#0F172A"
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            branding: {
                                                ...(prev.branding || {}),
                                                colors: { ...(prev.branding?.colors || {}), primary: e.target.value }
                                            }
                                        } : null)}
                                        className="font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-semibold">Color Acento (Light Mode)</Label>
                                <div className="flex gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl ring-2 ring-slate-100 shadow-inner shrink-0 cursor-pointer overflow-hidden border-2 border-white"
                                        style={{ backgroundColor: config?.branding?.colors?.accent || '#3b82f6' }}
                                    >
                                        <input
                                            type="color"
                                            className="opacity-0 w-full h-full cursor-pointer"
                                            value={config?.branding?.colors?.accent || '#3b82f6'}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                branding: {
                                                    ...(prev.branding || {}),
                                                    colors: { ...(prev.branding?.colors || {}), accent: e.target.value }
                                                }
                                            } : null)}
                                        />
                                    </div>
                                    <Input
                                        value={config?.branding?.colors?.accent || ''}
                                        placeholder="#3B82F6"
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            branding: {
                                                ...(prev.branding || {}),
                                                colors: { ...(prev.branding?.colors || {}), accent: e.target.value }
                                            }
                                        } : null)}
                                        className="font-mono text-sm uppercase"
                                    />
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
                            <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300 bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">Primario (Dark Mode Override)</Label>
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
                                            placeholder={config?.branding?.colors?.primary || 'Original'}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                branding: {
                                                    ...(prev.branding || {}),
                                                    colors: { ...(prev.branding?.colors || {}), primaryDark: e.target.value }
                                                }
                                            } : null)}
                                            className="font-mono text-sm uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">Acento (Dark Mode Override)</Label>
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
                                            placeholder={config?.branding?.colors?.accent || 'Original'}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                branding: {
                                                    ...(prev.branding || {}),
                                                    colors: { ...(prev.branding?.colors || {}), accentDark: e.target.value }
                                                }
                                            } : null)}
                                            className="font-mono text-sm uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
    );
}
