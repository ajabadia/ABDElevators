"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoiStatProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    variant?: 'primary' | 'success' | 'info' | 'amber';
    className?: string;
}

/**
 * 📈 RoiStat Component (FASE 222B)
 * Extracted from billing usage page to provide a consistent look for KPI-style mini-metrics.
 */
export function RoiStat({
    icon: Icon,
    value,
    label,
    variant = "primary",
    className
}: RoiStatProps) {
    const variants = {
        primary: "bg-primary/5 border-primary/10 text-primary",
        success: "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        info: "bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-400"
    };

    return (
        <div className={cn(
            "flex flex-col items-center p-4 rounded-3xl border transition-all hover:shadow-md",
            variants[variant],
            className
        )}>
            <div className="p-2 rounded-xl bg-background/50 mb-2 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-2xl font-black tracking-tighter tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-center mt-1">
                {label}
            </span>
        </div>
    );
}
