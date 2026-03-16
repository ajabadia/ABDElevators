"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

/**
 * 🌀 LoadingState
 * Stardardized accessible loading component (Era 15 Audit Requirement).
 */
export function LoadingState({
    message = "Cargando...",
    fullScreen = false,
    className
}: LoadingStateProps) {
    const containerClasses = cn(
        "flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500",
        fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "w-full py-12",
        className
    );

    return (
        <div 
            className={containerClasses}
            role="status" 
            aria-live="polite" 
            aria-label={message}
        >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {message && (
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
}
