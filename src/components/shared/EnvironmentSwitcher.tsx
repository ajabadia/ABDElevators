"use client";

import { useEnvironmentStore } from "@/store/environment-store";
import { AppEnvironment } from "@/lib/schemas";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, FlaskConical, Construction, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function EnvironmentSwitcher() {
    const { environment, setEnvironment } = useEnvironmentStore();

    const envConfig: Record<string, {
        label: string;
        icon: any;
        color: string;
        bg: string;
        border: string;
        badge: string;
    }> = {
        PRODUCTION: {
            label: "Production",
            icon: Globe,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            badge: "bg-emerald-500 hover:bg-emerald-600"
        },
        STAGING: {
            label: "Staging",
            icon: FlaskConical,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            badge: "bg-amber-500 hover:bg-amber-600"
        },
        SANDBOX: {
            label: "User Sandbox",
            icon: Construction,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            badge: "bg-purple-500 hover:bg-purple-600"
        }
    };

    const current = envConfig[environment];
    const Icon = current.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    suppressHydrationWarning
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-9 px-3 gap-2 border transition-all duration-300",
                        current.bg,
                        current.border
                    )}
                >
                    <Icon className={cn("h-4 w-4", current.color)} />
                    <span className="font-semibold hidden sm:inline">{current.label}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Change Environment</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => setEnvironment('PRODUCTION')}
                    className="gap-3 py-2 cursor-pointer"
                >
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                        <Globe className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Production</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">Live, customer-facing RAG.</span>
                    </div>
                    {environment === 'PRODUCTION' && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => setEnvironment('STAGING')}
                    className="gap-3 py-2 cursor-pointer"
                >
                    <div className="bg-amber-500/10 p-1.5 rounded-lg">
                        <FlaskConical className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Staging</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">Pre-release testing area.</span>
                    </div>
                    {environment === 'STAGING' && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => setEnvironment('SANDBOX')}
                    className="gap-3 py-2 cursor-pointer"
                >
                    <div className="bg-purple-500/10 p-1.5 rounded-lg">
                        <Construction className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Sandbox</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">Personal private experiments.</span>
                    </div>
                    {environment === 'SANDBOX' && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
