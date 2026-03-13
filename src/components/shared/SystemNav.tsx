"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Settings2,
    Globe,
    Sun,
    Moon,
    Monitor,
    ShieldCheck,
    Activity,
    Building2,
    Scale,
    Stethoscope,
    Terminal,
    X,
    Check,
    Sparkles
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHealthStore } from "@/store/health-store";
import { useIndustryStore } from "@/store/industry-store";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IndustryType } from "@/lib/schemas";

const languages = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇺🇸" },
];

import { useUxMode } from "@/components/ux-mode-provider";
import { Switch } from "@/components/ui/switch";

const environments = [
    { code: "PRODUCTION", label: "Production", color: "text-emerald-500" },
    { code: "STAGING", label: "Staging", color: "text-amber-500" },
    { code: "SANDBOX", label: "Sandbox", color: "text-blue-500" },
];

/**
 * SystemNav
 * ERA 11: Centralized Command Hub.
 * Refactored to Modal (Dialog) for maximum reliability and UX.
 */
export function SystemNav() {
    const t = useTranslations("common");
    const locale = useLocale();
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    const { environment, setEnvironment } = useEnvironmentStore();
    const { health, fetchHealth } = useHealthStore();
    const { industry, setIndustry } = useIndustryStore();
    const { data: session, update: updateSession } = useSession();
    const { uxMode, setUxMode } = useUxMode();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchHealth();
        const interval = setInterval(() => fetchHealth(), 60000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const handleLocaleChange = (newLocale: string) => {
        if (newLocale === locale) return;
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        toast.info(`Cambiando idioma a ${newLocale}...`);
        setOpen(false);
        setTimeout(() => window.location.reload(), 150);
    };

    const handleEnvironmentChange = (env: any) => {
        if (env === environment) {
            toast.info(`Ya estás en el entorno ${env}`);
            return;
        }
        setEnvironment(env);
        toast.success(`Entorno cambiado a ${env}`);
        setOpen(false);
        setTimeout(() => router.refresh(), 150);
    };

    const handleIndustryChange = async (ind: IndustryType) => {
        if (ind === industry) {
            toast.info(`Ya estás en la vertical ${ind}`);
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update Global State
            setIndustry(ind);

            // 2. Sync with Session (Critical for Menus & Permissions)
            if (updateSession) {
                await updateSession({
                    user: {
                        ...session?.user,
                        industry: ind
                    }
                });
            }

            toast.success(`Vertical cambiada a ${ind}`);
            setOpen(false);

            // 🕒 Wait for session propagation before refresh
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Failed to change vertical:", error);
            toast.error("Error al sincronizar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return <div className="w-10 h-10 animate-pulse bg-muted rounded-full" />;

    const isProcessing = (health?.activeProcessingCount || 0) > 0;
    const statusColor = health?.status === 'CRITICAL'
        ? 'text-destructive'
        : health?.status === 'WARNING'
            ? 'text-amber-500'
            : isProcessing
                ? 'text-primary'
                : 'text-emerald-500';

    const verticals: { code: IndustryType; label: string; icon: any; color: string; bg: string }[] = [
        { code: 'ELEVATORS', label: t('system_nav.verticals.elevators'), icon: Building2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { code: 'LEGAL', label: t('system_nav.verticals.legal'), icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { code: 'BANKING', label: t('system_nav.verticals.banking') || 'Banking', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { code: 'INSURANCE', label: t('system_nav.verticals.insurance') || 'Insurance', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { code: 'REAL_ESTATE', label: t('system_nav.verticals.real_estate') || 'Real Estate', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2 gap-2 hover:bg-muted transition-all rounded-full border border-border/40"
                    aria-label="System Settings"
                >
                    <div className="flex -space-x-1 items-center pointer-events-none">
                        <div className={cn("inline-flex items-center justify-center p-1 rounded-full", statusColor)}>
                            <Activity className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase opacity-60 px-1 border-l border-border/50">
                            {locale}
                        </span>
                    </div>
                    <Settings2 className="h-3.5 w-3.5 opacity-40 pointer-events-none" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight uppercase">{t('system_nav.center')}</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-1">
                                Panel de control central del sistema y configuración global
                            </DialogDescription>
                        </div>
                        <div className={cn("flex flex-col items-end gap-1 px-3 py-1 rounded-xl bg-muted/40 border border-border/20", statusColor.replace('text-', 'bg-').replace('500', '500/10'))}>
                            <div className="flex items-center gap-1.5">
                                <Activity className={cn("h-3 w-3", statusColor)} />
                                <span className={cn("text-[10px] font-black uppercase tracking-tight", statusColor)}>
                                    {health?.status || 'OPTIMAL'}
                                </span>
                            </div>
                            <span className="text-[8px] font-bold opacity-60 uppercase text-right">
                                {isProcessing ? `${health?.activeProcessingCount} jobs` : 'Healthy'}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-6">
                    {/* Section: Language */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Globe className="h-3.5 w-3.5 opacity-40" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('system_nav.language')}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLocaleChange(lang.code)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-semibold",
                                        locale === lang.code
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-base">{lang.flag}</span>
                                        {lang.label}
                                    </div>
                                    {locale === lang.code && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section: Theme */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Sun className="h-3.5 w-3.5 opacity-40" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('system_nav.appearance')}</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'light', icon: Sun, label: t('command_menu.themes.light') },
                                { id: 'dark', icon: Moon, label: t('command_menu.themes.dark') },
                                { id: 'system', icon: Monitor, label: t('command_menu.themes.system') }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setTheme(item.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-[11px] font-bold",
                                        theme === item.id
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-border/40 hover:border-primary/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section: Expert Mode */}
                    <div className="space-y-3 pt-2 border-t border-border/20">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-all duration-500",
                                    uxMode === 'expert' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 rotate-12" : "bg-muted text-muted-foreground opacity-40"
                                )}>
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{t('expertMode.label', { defaultValue: 'Modo Experto' })}</h4>
                                        {uxMode === 'expert' && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] h-3.5 px-1 uppercase font-black">Active</Badge>}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                                        {t('expertMode.switchDescription', { defaultValue: 'Visualiza metadatos técnicos y opciones avanzadas de RAG.' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                <Switch
                                    checked={uxMode === 'expert'}
                                    onCheckedChange={(checked) => setUxMode(checked ? 'expert' : 'simple')}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Shift + X</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Context (Env & Industry) */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <ShieldCheck className="h-3.5 w-3.5 opacity-40" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('system_nav.environment')}</h4>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {environments.map((env) => (
                                    <button
                                        key={env.code}
                                        onClick={() => handleEnvironmentChange(env.code)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-xs font-bold",
                                            environment === env.code
                                                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
                                                : "border-border/40 hover:border-border text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {env.label}
                                        {environment === env.code && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Building2 className="h-3.5 w-3.5 opacity-40" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('system_nav.vertical')}</h4>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {verticals.map((v) => (
                                    <button
                                        key={v.code}
                                        disabled={isSaving}
                                        onClick={() => handleIndustryChange(v.code)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-bold w-full",
                                            industry === v.code
                                                ? cn("border-border shadow-sm ring-1 ring-border/20", v.bg, v.color)
                                                : "border-border/40 text-muted-foreground hover:bg-muted/50",
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <v.icon className={cn("h-3 w-3", industry === v.code ? v.color : "opacity-40")} />
                                        <span className="truncate">{v.label}</span>
                                        {industry === v.code && (
                                            <div className={cn("ml-auto h-1.5 w-1.5 rounded-full", v.color.replace('text-', 'bg-'))} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            disabled={isSaving}
                            onClick={() => {
                                setOpen(false);
                                router.push('/admin-dashboard');
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border/40 hover:border-primary/40 text-[10px] font-black uppercase tracking-tight text-primary transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
                        >
                            <Terminal className="h-3 w-3" />
                            {t('navigation.items.operationsHub')}
                        </button>
                        {isSaving && (
                            <div className="flex items-center gap-2 animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Sincronizando...</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cerrar Escápula
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
