'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuotaProgressProps {
    label: string;
    used: number;
    limit: number;
    unit: string;
    className?: string;
}

export const QuotaProgress = ({ label, used, limit, unit, className }: QuotaProgressProps) => {
    const percentage = Math.min(100, Math.max(0, (used / limit) * 100));
    const isCritical = percentage > 90;
    const isWarning = percentage > 75;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className={cn("font-medium", isCritical ? "text-destructive" : "")}>
                    {used.toLocaleString()} / {limit === -1 ? '∞' : limit.toLocaleString()} {unit}
                </span>
            </div>
            <Progress
                value={percentage}
                className={cn("h-2", isCritical ? "bg-destructive/20" : "bg-secondary")}
                indicatorClassName={cn(
                    isCritical ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"
                )}
            />
            {limit !== -1 && (
                <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% utilizado
                </div>
            )}
        </div>
    );
};
