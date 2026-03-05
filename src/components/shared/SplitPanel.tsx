"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SplitPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /**
     * Determines how the space is divided on xl screens.
     * Default: '60/40' (Left 60%, Right 40%)
     */
    layout?: "50/50" | "60/40" | "70/30" | "30/70" | "40/60";
}

export function SplitPanel({ children, layout = "60/40", className, ...props }: SplitPanelProps) {
    const layoutClasses = {
        "50/50": "xl:grid-cols-2",
        "60/40": "xl:grid-cols-5",
        "70/30": "xl:grid-cols-10",
        "30/70": "xl:grid-cols-10",
        "40/60": "xl:grid-cols-5",
    };

    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-6 w-full h-full",
                layoutClasses[layout],
                className
            )}
            {...props}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { layout });
                }
                return child;
            })}
        </div>
    );
}

interface SplitPanelLeftProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    layout?: string; // Passed implicitly by parent SplitPanel
}

export function SplitPanelLeft({ children, layout, className, ...props }: SplitPanelLeftProps) {
    const spanClasses: Record<string, string> = {
        "50/50": "xl:col-span-1",
        "60/40": "xl:col-span-3",
        "70/30": "xl:col-span-7",
        "30/70": "xl:col-span-3",
        "40/60": "xl:col-span-2",
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-6 w-full",
                layout ? spanClasses[layout] || "" : "",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface SplitPanelRightProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    layout?: string; // Passed implicitly by parent SplitPanel
}

export function SplitPanelRight({ children, layout, className, ...props }: SplitPanelRightProps) {
    const spanClasses: Record<string, string> = {
        "50/50": "xl:col-span-1",
        "60/40": "xl:col-span-2",
        "70/30": "xl:col-span-3",
        "30/70": "xl:col-span-7",
        "40/60": "xl:col-span-3",
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-6 w-full h-full",
                layout ? spanClasses[layout] || "" : "",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
