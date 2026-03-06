"use client";

import { Menu, Search, Bell, Building2, Scale, Stethoscope, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';
import { UserNav } from './UserNav';
import { useSession } from 'next-auth/react';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { ThePulseWidget } from './ThePulseWidget';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { FeatureFlags } from '@/services/security/feature-flags';
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { LanguageSelector } from './LanguageSelector';
import { useUXStore } from '@/store/ux-store';
import { HelpCircle, Activity } from 'lucide-react';
import { NowPanel } from './NowPanel';

export function Header() {
    const t = useTranslations("common");
    const { data: session } = useSession();
    const { toggleSidebar } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Vertical local state for demo purposes as found in previous versions
    const [vertical, setVertical] = useState<'elevators' | 'legal' | 'medical'>('elevators');

    const verticalTitleKey = vertical === 'elevators'
        ? 'verticals.elevators'
        : vertical === 'legal'
            ? 'verticals.legal'
            : 'verticals.clinical';

    const { helpMode, toggleHelpMode } = useUXStore();
    const [nowPanelOpen, setNowPanelOpen] = useState(false);

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="lg:hidden"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        {t('navigation.sections.core')}
                    </span>
                    <span className="text-muted-foreground/30">/</span>
                    <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {t(verticalTitleKey)}
                    </h2>

                    {mounted && FeatureFlags.isEnabled('DEMO_MODE_UI') && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold border border-dashed border-primary/20 hover:border-primary/40 text-primary/70">
                                    DEMO
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Select Vertical</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setVertical('elevators')} className="text-xs">
                                    <Building2 className="mr-2 h-3.5 w-3.5 text-orange-500" /> {t('verticals.elevators')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setVertical('legal')} className="text-xs">
                                    <Scale className="mr-2 h-3.5 w-3.5 text-blue-500" /> {t('verticals.legal')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setVertical('medical')} className="text-xs">
                                    <Stethoscope className="mr-2 h-3.5 w-3.5 text-green-500" /> {t('verticals.clinical')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {mounted && FeatureFlags.isEnabled('ENFORCE_MFA_ADMIN') && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-600/70 text-[10px] font-black uppercase tracking-tighter cursor-help group relative" title="MFA Enforcement Active">
                            <Shield className="h-2.5 w-2.5 animate-pulse" />
                            MFA
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                <div className="hidden md:block">
                    {mounted && <DynamicBreadcrumb />}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-full max-w-sm hidden lg:block mr-2">
                    <CommandMenu />
                </div>

                {/* Now Panel Trigger */}
                {mounted && (
                    <button
                        onClick={() => setNowPanelOpen(true)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full bg-slate-900 text-slate-50 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Activity className="w-3.5 h-3.5 text-teal-400" />
                        <span className="hidden sm:inline">Ahora mismo</span>
                    </button>
                )}

                {/* Help Mode Trigger */}
                {mounted && (
                    <button
                        onClick={toggleHelpMode}
                        title="Modo Ayuda Contextual"
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-full border transition-all ${helpMode
                            ? 'bg-primary/10 border-primary/30 text-primary shadow-inner'
                            : 'bg-card border-border hover:bg-muted text-muted-foreground'
                            }`}
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">{helpMode ? 'Ocultar ayudas' : 'Ayuda'}</span>
                    </button>
                )}

                <EnvironmentSwitcher />
                {mounted && <ThePulseWidget />}
                <LanguageSelector />
                <ThemeToggle />
                <NotificationBell />
                <div className="h-6 w-px bg-border mx-1"></div>
                <UserNav />
            </div>

            <NowPanel open={nowPanelOpen} onOpenChange={setNowPanelOpen} />
        </header>
    );
}
