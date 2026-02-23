"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Popover = ({ children }: { children: React.ReactNode }) => {
    return <div className="relative inline-block">{children}</div>
}

const PopoverTrigger = ({ children, asChild, ...props }: any) => {
    return <div {...props}>{children}</div>
}

const PopoverContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { align?: string; sideOffset?: number }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "absolute top-full mt-2 left-1/2 -translate-x-1/2", // Basic positioning fallback
            className
        )}
        {...props}
    />
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
