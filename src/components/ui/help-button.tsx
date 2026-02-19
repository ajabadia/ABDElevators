"use client"

import React, { useState, useRef, useEffect } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HelpTooltipComponent } from "./help-tooltip"
import { useContextualHelp } from "@/hooks/useContextualHelp"
import { cn } from "@/lib/utils"

interface HelpButtonProps {
    contextId: string
    position?: "top" | "right" | "bottom" | "left"
    size?: "sm" | "md" | "lg"
    variant?: "icon" | "text" | "inline"
    label?: string
    className?: string
}

export function HelpButton({
    contextId,
    position = "right",
    size = "sm",
    variant = "icon",
    label = "Ayuda",
    className
}: HelpButtonProps) {
    const { getHelp, toggleHelp, closeHelp } = useContextualHelp()
    const [isOpen, setIsOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const help = getHelp(contextId)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    if (!help) return null

    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10"
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen)
        toggleHelp(contextId)
    }

    return (
        <div className="relative inline-block">
            {variant === "icon" && (
                <Button
                    ref={buttonRef}
                    variant="ghost"
                    size="icon"
                    className={cn(sizeClasses[size], "hover:bg-secondary/10", className)}
                    onClick={handleClick}
                    aria-label={label}
                >
                    <HelpCircle className={cn(
                        "text-muted-foreground hover:text-foreground",
                        size === "sm" && "w-4 h-4",
                        size === "md" && "w-5 h-5",
                        size === "lg" && "w-6 h-6"
                    )} />
                </Button>
            )}

            {variant === "text" && (
                <Button
                    ref={buttonRef}
                    variant="ghost"
                    size="sm"
                    className={cn("text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/10 gap-1 h-6 px-2", className)}
                    onClick={handleClick}
                >
                    <HelpCircle className="w-3 h-3" />
                    {label}
                </Button>
            )}

            {variant === "inline" && (
                <button
                    ref={buttonRef}
                    className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors cursor-help ml-1.5 -mt-0.5 shrink-0",
                        className
                    )}
                    onClick={handleClick}
                    aria-label={label}
                    title={label}
                >
                    <HelpCircle className="w-3 h-3" />
                </button>
            )}

            {/* Tooltip */}
            {isOpen && (
                <HelpTooltipComponent
                    help={help}
                    onClose={() => {
                        setIsOpen(false)
                        closeHelp()
                    }}
                    position={position}
                />
            )}
        </div>
    )
}
