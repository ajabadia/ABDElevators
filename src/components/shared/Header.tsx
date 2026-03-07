"use client";

import { Menu, Activity, HelpCircle } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';
import { UserNav } from './UserNav';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { SystemNav } from './SystemNav';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useUXStore } from '@/store/ux-store';
import { NowPanel } from './NowPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export function Header() {
    const t = useTranslations("common");
    const { toggleSidebar } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

                <div className="flex items-center gap-3">
                    {/* Brand Icon / Logo */}
                    <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20">
                        A
                    </div>
                    <div className="h-6 w-px bg-border hidden md:block" />
                    <div className="hidden md:block">
                        {mounted && <DynamicBreadcrumb />}
                    </div>
                </div>
            </div>

            {/* Center Area: Search */}
            <div className="flex-1 max-w-md px-4 hidden sm:block">
                <CommandMenu />
            </div>

            <div className="flex items-center gap-2">
                <TooltipProvider>
                    {mounted && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setNowPanelOpen(true)}
                                    className="rounded-full hover:bg-teal-500/10 text-teal-600 transition-colors"
                                >
                                    <Activity className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ahora mismo</TooltipContent>
                        </Tooltip>
                    )}

                    {mounted && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleHelpMode}
                                    className={cn(
                                        "rounded-full transition-all",
                                        helpMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ayuda Contextual</TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>

                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                <SystemNav />

                <div className="h-6 w-px bg-border mx-1" />

                <div className="flex items-center gap-1">
                    <NotificationBell />
                    <UserNav />
                </div>
            </div>

            <NowPanel open={nowPanelOpen} onOpenChange={setNowPanelOpen} />
        </header>
    );
}
