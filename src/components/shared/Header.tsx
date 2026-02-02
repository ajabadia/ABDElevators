"use client";

import { Bell, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';
import { UserNav } from './UserNav';
import { useSession } from 'next-auth/react';
import { useBranding } from '@/context/BrandingContext';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Not used in the provided snippet, but included in the instruction's imports
import { Briefcase, Settings, LogOut, Building2, Scale, Stethoscope } from "lucide-react"; // Icons for verticals
import { FeatureFlags } from "@/lib/feature-flags";
import { useState } from "react";
import { Badge } from "@/components/ui/badge"; // Not used in the provided snippet, but included in the instruction's imports

export function Header() {
    const { toggleSidebar } = useSidebar();
    const { data: session } = useSession();
    const [vertical, setVertical] = useState<'elevators' | 'legal' | 'medical'>('elevators');

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>

                <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hidden md:block">
                        {vertical === 'elevators' ? 'Elevator Intelligence' : vertical === 'legal' ? 'Legal Mind' : 'Clinical Cortex'}
                    </h2>

                    {FeatureFlags.isEnabled('DEMO_MODE_UI') && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 border-dashed h-8">
                                    {vertical === 'elevators' && <Building2 className="h-4 w-4 text-orange-500" />}
                                    {vertical === 'legal' && <Scale className="h-4 w-4 text-blue-500" />}
                                    {vertical === 'medical' && <Stethoscope className="h-4 w-4 text-green-500" />}
                                    <span className="hidden md:inline capitalize">{vertical}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Vertical (Demo Mode)</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setVertical('elevators')}>
                                    <Building2 className="mr-2 h-4 w-4 text-orange-500" /> Elevators (Live)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setVertical('legal')}>
                                    <Scale className="mr-2 h-4 w-4 text-blue-500" /> Legal (Simulated)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setVertical('medical')}>
                                    <Stethoscope className="mr-2 h-4 w-4 text-green-500" /> Medical (Simulated)
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
                <ThemeToggle />
                <NotificationBell />
                <div className="h-6 w-px bg-border mx-1"></div>
                <UserNav />
            </div>
        </header>
    );
}
