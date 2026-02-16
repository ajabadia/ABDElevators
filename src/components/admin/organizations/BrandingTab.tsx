import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Palette, Upload, Loader2, Building, Trash2, FileText, Info, ShieldCheck, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/lib/schemas';
import { useTranslations } from "next-intl";

interface BrandingTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function BrandingTab({ config, setConfig }: BrandingTabProps) {
    const t = useTranslations('admin.organizations.branding');
    const tLogo = useTranslations('admin.organizations.branding.logo');
    const tFavicon = useTranslations('admin.organizations.branding.favicon');
    const tColors = useTranslations('admin.organizations.branding.colors');
    const tAutoDark = useTranslations('admin.organizations.branding.autoDarkMode');
    const tPreview = useTranslations('admin.organizations.branding.preview');

    // Report namespaces
    const tReports = useTranslations('admin.organizations.reports');
    const tDisc = useTranslations('admin.organizations.reports.disclaimer');
    const tSig = useTranslations('admin.organizations.reports.signature');
    const tFoot = useTranslations('admin.organizations.reports.footer');
    const tSources = useTranslations('admin.organizations.reports.includeSources');

    const { toast } = useToast();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [isPreviewDark, setIsPreviewDark] = useState(false);

    // Utility to lighten/darken a color for preview optimization
    const adjustColor = (hex: string, percent: number) => {
        if (!hex?.startsWith('#')) return hex;
        try {
            const num = parseInt(hex.replace("#", ""), 16),
                amt = Math.round(2.55 * percent),
                R = (num >> 16) + amt,
                G = (num >> 8 & 0x00FF) + amt,
                B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        } catch (e) {
            return hex;
        }
    };

    const updateReportConfig = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            reportConfig: {
                ...(config.reportConfig || { includeSources: true }),
                [field]: value
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-12">
                {/* Visual Identity Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                            <Palette size={20} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{t('title')}</h3>
                            <p className="text-slate-500 text-sm">{t('subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-slate-700 font-semibold">{tLogo('title')}</Label>
                            <div className="flex items-center gap-8 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden group">
                                    {isUploadingLogo ? (
                                        <Loader2 className="animate-spin text-teal-600" size={32} aria-hidden="true" />
                                    ) : config?.branding?.logo?.url ? (
                                        <img src={config.branding.logo.url} alt="Logo preview" className="object-contain max-w-[90%] max-h-[90%]" />
                                    ) : (
                                        <Building size={40} className="text-slate-200" aria-hidden="true" />
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
                                                                autoDarkMode: config.branding?.autoDarkMode ?? true,
                                                                ...(config.branding || {}),
                                                                logo: data.asset
                                                            }
                                                        });
                                                        toast({ title: tLogo('success'), description: tLogo('successDesc') });
                                                    }
                                                } catch (err) {
                                                    toast({ title: tLogo('error'), description: tLogo('errorDesc'), variant: "destructive" });
                                                } finally {
                                                    setIsUploadingLogo(false);
                                                }
                                            }}
                                        />
                                        <Label htmlFor="logo-upload" className="cursor-pointer">
                                            <Button variant="outline" size="sm" asChild disabled={isUploadingLogo}>
                                                <span>
                                                    {isUploadingLogo ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
                                                    {tLogo('uploadButton')}
                                                </span>
                                            </Button>
                                        </Label>
                                        {config?.branding?.logo?.url && (
                                            <Button variant="ghost" className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setConfig(prev => prev ? {
                                                    ...prev,
                                                    branding: {
                                                        autoDarkMode: prev.branding?.autoDarkMode ?? true,
                                                        ...prev.branding,
                                                        logo: undefined
                                                    }
                                                } : null)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400">{tLogo('dimensions')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <Label className="text-slate-700 font-semibold">{tFavicon('title')}</Label>
                            <div className="flex items-center gap-8 p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden">
                                    {isUploadingFavicon ? (
                                        <Loader2 className="animate-spin text-teal-600" size={24} />
                                    ) : config?.branding?.favicon?.url ? (
                                        <img src={config.branding.favicon.url} alt="Favicon preview" className="object-contain w-8 h-8" />
                                    ) : (
                                        <Building size={24} className="text-slate-200" />
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
                                                                autoDarkMode: config.branding?.autoDarkMode ?? true,
                                                                ...(config.branding || {}),
                                                                favicon: data.asset
                                                            }
                                                        });
                                                        toast({ title: tFavicon('success'), description: tFavicon('successDesc') });
                                                    }
                                                } catch (err) {
                                                    toast({ title: tFavicon('error'), description: tFavicon('errorDesc'), variant: "destructive" });
                                                } finally {
                                                    setIsUploadingFavicon(false);
                                                }
                                            }}
                                        />
                                        <Label htmlFor="favicon-upload" className="cursor-pointer">
                                            <Button variant="outline" size="sm" asChild disabled={isUploadingFavicon}>
                                                <span>
                                                    {isUploadingFavicon ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                                                    {tFavicon('uploadButton')}
                                                </span>
                                            </Button>
                                        </Label>
                                        {config?.branding?.favicon?.url && (
                                            <Button variant="ghost" className="text-destructive h-8 px-2 hover:bg-destructive/10"
                                                onClick={() => setConfig(prev => prev ? {
                                                    ...prev,
                                                    branding: {
                                                        autoDarkMode: prev.branding?.autoDarkMode ?? true,
                                                        ...prev.branding,
                                                        favicon: undefined
                                                    }
                                                } : null)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400">{tFavicon('dimensions')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-semibold">{tColors('primary')}</Label>
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
                                                    autoDarkMode: prev.branding?.autoDarkMode ?? true,
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
                                                autoDarkMode: prev.branding?.autoDarkMode ?? true,
                                                ...(prev.branding || {}),
                                                colors: { ...(prev.branding?.colors || {}), primary: e.target.value }
                                            }
                                        } : null)}
                                        className="font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-semibold">{tColors('accent')}</Label>
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
                                                    autoDarkMode: prev.branding?.autoDarkMode ?? true,
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
                                                autoDarkMode: prev.branding?.autoDarkMode ?? true,
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
                                <Label htmlFor="auto-dark-mode" className="text-sm font-bold">{tAutoDark('title')}</Label>
                                <span className="text-[10px] text-slate-500">{tAutoDark('desc')}</span>
                            </div>
                        </div>

                        {config?.branding?.autoDarkMode === false && (
                            <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300 bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">{tColors('primaryDark')}</Label>
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
                                                        autoDarkMode: prev.branding?.autoDarkMode ?? true,
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
                                                    autoDarkMode: prev.branding?.autoDarkMode ?? true,
                                                    ...(prev.branding || {}),
                                                    colors: { ...(prev.branding?.colors || {}), primaryDark: e.target.value }
                                                }
                                            } : null)}
                                            className="font-mono text-sm uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">{tColors('accentDark')}</Label>
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
                                                        autoDarkMode: prev.branding?.autoDarkMode ?? true,
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
                                                    autoDarkMode: prev.branding?.autoDarkMode ?? true,
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

                {/* PDF Reports Configuration Section */}
                <div className="space-y-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{tReports('title')}</h3>
                            <p className="text-slate-500 text-sm">{tReports('subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                                <ShieldCheck size={16} className="text-teal-600" />
                                {tDisc('title')}
                            </Label>
                            <Textarea
                                placeholder={tDisc('placeholder')}
                                className="min-h-[100px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all resize-none"
                                value={config?.reportConfig?.disclaimer || ''}
                                onChange={(e) => updateReportConfig('disclaimer', e.target.value)}
                            />
                            <p className="text-[11px] text-slate-400">{tDisc('desc')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <PenTool size={16} className="text-teal-600" />
                                    {tSig('title')}
                                </Label>
                                <Input
                                    placeholder={tSig('placeholder')}
                                    className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                    value={config?.reportConfig?.signatureText || ''}
                                    onChange={(e) => updateReportConfig('signatureText', e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <Info size={16} className="text-teal-600" />
                                    {tFoot('title')}
                                </Label>
                                <Input
                                    placeholder={tFoot('placeholder')}
                                    className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                    value={config?.reportConfig?.footerText || ''}
                                    onChange={(e) => updateReportConfig('footerText', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-center">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex flex-col">
                                    <Label className="text-sm font-bold">{tSources('title')}</Label>
                                    <span className="text-[10px] text-slate-500">{tSources('desc')}</span>
                                </div>
                                <Switch
                                    checked={config?.reportConfig?.includeSources !== false}
                                    onCheckedChange={(checked) => updateReportConfig('includeSources', checked)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Palette size={16} className="text-teal-600" />
                                    Color Impresión PDF
                                </Label>
                                <div className="flex gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg ring-1 ring-slate-200 shadow-sm shrink-0 cursor-pointer overflow-hidden border border-white"
                                        style={{ backgroundColor: config?.reportConfig?.primaryColor || config?.branding?.colors?.primary || '#0d9488' }}
                                    >
                                        <input
                                            type="color"
                                            className="opacity-0 w-full h-full cursor-pointer"
                                            value={config?.reportConfig?.primaryColor || config?.branding?.colors?.primary || '#0d9488'}
                                            onChange={(e) => updateReportConfig('primaryColor', e.target.value)}
                                        />
                                    </div>
                                    <Input
                                        value={config?.reportConfig?.primaryColor || ''}
                                        placeholder={config?.branding?.colors?.primary || "#0D9488"}
                                        onChange={(e) => updateReportConfig('primaryColor', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="sticky top-8 space-y-8">
                    {/* App Preview Card */}
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-800 text-sm tracking-wider uppercase">{tPreview('title')}</h4>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-full border shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 px-3 rounded-full text-[10px] font-bold", !isPreviewDark ? "bg-slate-900 text-white" : "text-slate-500")}
                                    onClick={() => setIsPreviewDark(false)}
                                >
                                    {tPreview('light')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 px-3 rounded-full text-[10px] font-bold", isPreviewDark ? "bg-slate-900 text-white" : "text-slate-500")}
                                    onClick={() => setIsPreviewDark(true)}
                                >
                                    {tPreview('dark')}
                                </Button>
                            </div>
                        </div>

                        <div className={cn(
                            "rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-500",
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
                        <p className="text-center text-[10px] text-slate-400">
                            {isPreviewDark ? tPreview('darkDesc') : tPreview('lightDesc')}
                        </p>
                    </div>

                    {/* Report Preview Card */}
                    <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">{tReports('preview')}</h4>

                        <div className="space-y-4 opacity-80">
                            <div className="h-4 w-3/4 bg-white/20 rounded" />
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-white/10 rounded" />
                                <div className="h-2 w-full bg-white/10 rounded" />
                                <div className="h-2 w-2/3 bg-white/10 rounded" />
                            </div>

                            <div className="pt-8 space-y-2">
                                <div className="h-2 w-40 bg-teal-500/30 rounded" style={{ backgroundColor: (config?.reportConfig?.primaryColor || config?.branding?.colors?.primary || '#0d9488') + '4D' }} />
                                <p className="text-[10px] text-teal-300 font-mono italic">
                                    {config?.reportConfig?.signatureText || 'Línea de firma...'}
                                </p>
                                <div className="h-[1px] w-24 bg-teal-500/50" style={{ backgroundColor: (config?.reportConfig?.primaryColor || config?.branding?.colors?.primary || '#0d9488') + '80' }} />
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="h-2 w-20 bg-slate-700 rounded" />
                                <p className="text-[9px] text-slate-400 leading-relaxed italic line-clamp-2">
                                    {config?.reportConfig?.disclaimer || 'Aviso legal del reporte...'}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[8px] text-white/30 uppercase tracking-widest">
                                <span>{config?.reportConfig?.footerText || 'ABD Engine v1.0'}</span>
                                <span>Página 1 de 1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
