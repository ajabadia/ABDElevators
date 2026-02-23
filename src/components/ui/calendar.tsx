"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    mode?: "single" | "range" | "multiple"
}

function Calendar({
    className,
    selected,
    onSelect,
    ...props
}: CalendarProps) {
    return (
        <div className={cn("p-3 text-center border rounded-md bg-background", className)} {...props}>
            <p className="text-xs text-muted-foreground mb-2">Calendar (react-day-picker missing)</p>
            <input
                type="date"
                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                value={selected ? selected.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                    if (onSelect) {
                        onSelect(e.target.value ? new Date(e.target.value) : undefined);
                    }
                }}
            />
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
