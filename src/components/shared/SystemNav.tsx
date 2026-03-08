"use client";

import React, { useState, useEffect } from "react";
import {
    Settings2,
    Globe,
    Sun,
    Moon,
    Monitor,
    ChevronDown,
    ShieldCheck,
    Activity,
    Building2,
    Scale,
    Stethoscope
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHealthStore } from "@/store/health-store";
import { useIndustryStore } from "@/store/industry-store";
import { useRouter } from "next/navigation";

const languages = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇺🇸" },
];

export function SystemNav() {
    const t = useTranslations("common");
    const locale = useLocale();
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    const { environment, setEnvironment } = useEnvironmentStore();
    const { health, fetchHealth } = useHealthStore();
    const { industry, setIndustry } = useIndustryStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchHealth();
        const interval = setInterval(() => fetchHealth(), 60000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const handleLocaleChange = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2 gap-2 hover:bg-muted transition-all rounded-full border border-border/40"
                >
                    <div className="flex -space-x-1 items-center">
                        <div className={cn("inline-flex items-center justify-center p-1 rounded-full", statusColor)}>
                            <Activity className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase opacity-60 px-1 border-l border-border/50">
                            {locale}
                        </span>
                    </div>
                    <Settings2 className="h-3.5 w-3.5 opacity-40" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl backdrop-blur-xl bg-background/95 border-border/40">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">
                    {t('system_nav.center')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Health Overview */}
                <div className="px-2 py-3 mb-1 bg-muted/30 rounded-xl border border-border/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t('system_nav.status')}</span>
                        <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusColor.replace('text-', 'bg-'))} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-black uppercase tracking-tight", statusColor)}>
                            {health?.status || 'OPTIMAL'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                            {isProcessing ? `${health?.activeProcessingCount} jobs active` : 'No active tasks'}
                        </span>
                    </div>
                </div>

                {/* Submenus for config */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-lg py-2">
                        <Globe className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-sm font-medium">{t('system_nav.language')}</span>
                        <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">{locale}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl">
                        {languages.map((lang) => (
                            <DropdownMenuItem
                                key={lang.code}
                                onClick={() => handleLocaleChange(lang.code)}
                                className={cn("flex items-center gap-2", locale === lang.code && "bg-primary/10 text-primary")}
                            >
                                <span>{lang.flag}</span>
                                {lang.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-lg py-2">
                        {theme === 'dark' ? <Moon className="mr-2 h-4 w-4 opacity-70" /> : <Sun className="mr-2 h-4 w-4 opacity-70" />}
                        <span className="text-sm font-medium">{t('system_nav.appearance')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl">
                        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                            <Sun className="h-4 w-4" /> {t('command_menu.themes.light')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                            <Moon className="h-4 w-4" /> {t('command_menu.themes.dark')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                            <Monitor className="h-4 w-4" /> {t('command_menu.themes.system')}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-lg py-2">
                        <ShieldCheck className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-sm font-medium">{t('system_nav.environment')}</span>
                        <span className="ml-auto text-[10px] font-bold text-emerald-500">{environment}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl">
                        <DropdownMenuItem onClick={() => setEnvironment('PRODUCTION')} className={cn(environment === 'PRODUCTION' && "bg-primary/10")}>Production</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEnvironment('STAGING')} className={cn(environment === 'STAGING' && "bg-primary/10")}>Staging</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEnvironment('SANDBOX')} className={cn(environment === 'SANDBOX' && "bg-primary/10")}>Sandbox</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-lg py-2">
                        <Building2 className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-sm font-medium">{t('system_nav.vertical')}</span>
                        <span className="ml-auto text-[10px] font-bold text-orange-500 uppercase">{industry}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl">
                        <DropdownMenuItem onClick={() => setIndustry('ELEVATORS')} className="gap-2">
                            <Building2 className="h-4 w-4 text-orange-500" /> {t('system_nav.verticals.elevators')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIndustry('LEGAL')} className="gap-2">
                            <Scale className="h-4 w-4 text-blue-500" /> {t('system_nav.verticals.legal')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIndustry('MEDICAL')} className="gap-2">
                            <Stethoscope className="h-4 w-4 text-green-500" /> {t('system_nav.verticals.clinical')}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="text-[10px] font-bold uppercase text-primary/80 hover:text-primary transition-colors cursor-pointer py-2"
                    onClick={() => router.push('/admin/operations')}
                >
                    {t('navigation.items.operationsHub')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
