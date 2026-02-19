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
    variant?: "primary" | "secondary" | "muted";
    className?: string;
    description?: string;
}

export function MetricCard({
    title,
    value,
    icon,
    trend,
    trendDirection = "neutral",
    className,
    description,
    variant = "muted"
}: MetricCardProps & { variant?: "primary" | "secondary" | "muted" }) {
    const colors = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary/10 text-secondary",
        muted: "bg-muted text-muted-foreground",
    };

    const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;
    const trendColor = trendDirection === "up" ? "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20" : trendDirection === "down" ? "text-rose-600 bg-rose-50/50 dark:bg-rose-950/20" : "text-muted-foreground bg-muted";

    return (
        <Card className={cn(
            "border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group bg-card rounded-3xl overflow-hidden",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    {icon && (
                        <div className={cn("p-3 rounded-2xl shadow-inner", colors[variant])}>
                            {icon}
                        </div>
                    )}
                    {trend && (
                        <Badge variant="outline" className={cn(
                            "text-[10px] font-black border-border py-1 px-2.5 rounded-full flex items-center gap-1",
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
