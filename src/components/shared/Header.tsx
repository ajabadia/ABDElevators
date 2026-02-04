"use client";

import { Menu, Search, Bell, Building2, Scale, Stethoscope } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';
import { UserNav } from './UserNav';
import { useSession } from 'next-auth/react';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { FeatureFlags } from "@/lib/feature-flags";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { LanguageSelector } from './LanguageSelector';

export function Header() {
    const t = useTranslations("common");
    const { data: session } = useSession();
    const { toggleSidebar } = useSidebar();

    // Vertical local state for demo purposes as found in previous versions
    const [vertical, setVertical] = useState<'elevators' | 'legal' | 'medical'>('elevators');

    const verticalTitleKey = vertical === 'elevators'
        ? 'verticals.elevators'
        : vertical === 'legal'
            ? 'verticals.legal'
            : 'verticals.clinical';

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

                    {FeatureFlags.isEnabled('DEMO_MODE_UI') && (
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
                </div>

                <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                <div className="hidden md:block">
                    <DynamicBreadcrumb />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-full max-w-sm hidden lg:block mr-2">
                    <CommandMenu />
                </div>
                <EnvironmentSwitcher />
                <LanguageSelector />
                <ThemeToggle />
                <NotificationBell />
                <div className="h-6 w-px bg-border mx-1"></div>
                <UserNav />
            </div>
        </header>
    );
}
