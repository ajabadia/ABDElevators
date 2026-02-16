"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendDirection?: "up" | "down" | "neutral";
    color?: "blue" | "amber" | "emerald" | "purple" | "teal" | "rose" | "slate";
    className?: string;
    description?: string;
}

export function MetricCard({
    title,
    value,
    icon,
    trend,
    trendDirection = "neutral",
    color = "slate",
    className,
    description
}: MetricCardProps) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-500",
        amber: "bg-amber-500/10 text-amber-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
        purple: "bg-purple-500/10 text-purple-500",
        teal: "bg-teal-500/10 text-teal-500",
        rose: "bg-rose-500/10 text-rose-500",
        slate: "bg-slate-100 dark:bg-slate-800 text-slate-500",
    };

    const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;
    const trendColor = trendDirection === "up" ? "text-emerald-500 bg-emerald-50/50" : trendDirection === "down" ? "text-rose-500 bg-rose-50/50" : "text-slate-500 bg-slate-50/50";

    return (
        <Card className={cn(
            "border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group bg-card rounded-3xl overflow-hidden",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    {icon && (
                        <div className={cn("p-3 rounded-2xl shadow-inner", colors[color])}>
                            {icon}
                        </div>
                    )}
                    {trend && (
                        <Badge variant="outline" className={cn(
                            "text-[10px] font-black border-slate-100 dark:border-slate-800 py-1 px-2.5 rounded-full flex items-center gap-1",
                            trendColor
                        )}>
                            <TrendIcon size={10} /> {trend}
                        </Badge>
                    )}
                </div>
                <div>
                    <h3 className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-70 truncate" title={title}>
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl lg:text-4xl font-black text-foreground tabular-nums tracking-tighter">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
