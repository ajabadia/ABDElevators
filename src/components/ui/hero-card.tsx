"use client";

import React, { createContext, useContext } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Context for Compound Component
const HeroCardContext = createContext<{ variant?: 'default' | 'highlight' }>({});

interface HeroCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'highlight';
}

export function HeroCard({ children, className, onClick, variant = 'default' }: HeroCardProps) {
    return (
        <HeroCardContext.Provider value={{ variant }}>
            <Card
                onClick={onClick}
                className={cn(
                    "transition-all duration-200 hover:shadow-md cursor-pointer group overflow-hidden relative",
                    variant === 'highlight' ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border",
                    className
                )}
            >
                <CardContent className="p-6 relative z-10">
                    {children}
                </CardContent>

                {/* Decoration for highlight variant */}
                {variant === 'highlight' && (
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-background/10 rounded-full blur-2xl pointer-events-none" />
                )}
            </Card>
        </HeroCardContext.Provider>
    );
}

// Sub-components

interface HeroCardHeaderProps {
    title: string;
    icon?: React.ElementType;
}

HeroCard.Header = function HeroCardHeader({ title, icon: Icon }: HeroCardHeaderProps) {
    const { variant } = useContext(HeroCardContext);

    return (
        <div className="flex items-center justify-between mb-2">
            <span className={cn(
                "text-sm font-medium uppercase tracking-wider",
                variant === 'highlight' ? "text-primary-foreground/90" : "text-muted-foreground"
            )}>
                {title}
            </span>
            {Icon && (
                <div className={cn(
                    "p-2 rounded-full",
                    variant === 'highlight' ? "bg-background/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
};

interface HeroCardMetricProps {
    value: string | number;
    description?: string;
}

HeroCard.Metric = function HeroCardMetric({ value, description }: HeroCardMetricProps) {
    const { variant } = useContext(HeroCardContext);

    return (
        <div>
            <div className={cn(
                "text-3xl font-bold tracking-tight",
                variant === 'highlight' ? "text-primary-foreground" : "text-foreground"
            )}>
                {value}
            </div>
            {description && (
                <p className={cn(
                    "text-xs mt-1",
                    variant === 'highlight' ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    {description}
                </p>
            )}
        </div>
    );
};

interface HeroCardTrendProps {
    value: number; // percentage, e.g. 12.5 or -5.0
    label?: string;
}

HeroCard.Trend = function HeroCardTrend({ value, label }: HeroCardTrendProps) {
    const { variant } = useContext(HeroCardContext);
    const t = useTranslations('components.HeroCard');

    const isPositive = value > 0;
    const isNeutral = value === 0;

    const Icon = isNeutral ? Minus : (isPositive ? TrendingUp : TrendingDown);
    const trendColor = variant === 'highlight'
        ? "text-primary-foreground bg-background/20"
        : (isPositive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : (isNeutral ? "text-muted-foreground bg-muted" : "text-rose-600 bg-rose-50 dark:bg-rose-950/30"));

    return (
        <div className="flex items-center gap-2 mt-4">
            <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", trendColor)}>
                <Icon className="w-3 h-3" />
                <span>{Math.abs(value)}%</span>
            </div>
            <span className={cn(
                "text-xs",
                variant === 'highlight' ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
                {label || (isPositive ? t('trend_up') : (isNeutral ? t('trend_neutral') : t('trend_down')))}
            </span>
        </div>
    );
};
