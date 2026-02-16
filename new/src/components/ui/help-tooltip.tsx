"use client"

import React, { useState } from "react"
import {
    HelpCircle,
    X,
    ChevronRight,
    Lightbulb,
    ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HelpTooltip } from "@/hooks/useContextualHelp"

interface HelpTooltipProps {
    help: HelpTooltip
    onClose: () => void
    position?: "top" | "right" | "bottom" | "left"
    inline?: boolean
}

export function HelpTooltipComponent({
    help,
    onClose,
    position = "right",
    inline = false
}: HelpTooltipProps) {
    const [isExpanded, setIsExpanded] = useState(inline)

    const baseClasses = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"

    const positionClasses = {
        top: "absolute bottom-full mb-3 left-1/2 -translate-x-1/2",
        right: "absolute left-full ml-3 top-1/2 -translate-y-1/2",
        bottom: "absolute top-full mt-3 left-1/2 -translate-x-1/2",
        left: "absolute right-full mr-3 top-1/2 -translate-y-1/2"
    }

    const maxWidth = inline ? "w-full" : "w-96"

    return (
        <div className={cn(baseClasses, !inline && positionClasses[position], maxWidth, "p-5 pointer-events-auto")}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm text-foreground">
                            {help.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {help.content}
                        </p>
                    </div>
                </div>
                {!inline && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 -mt-1 -mr-1"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Example */}
            {help.example && (
                <>
                    <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            💡 Ejemplo:
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
                            {help.example}
                        </p>
                    </div>
                </>
            )}

            {/* Tips */}
            {help.tips && help.tips.length > 0 && (
                <>
                    {isExpanded || inline ? (
                        <div className="my-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                Tips:
                            </p>
                            <ul className="space-y-1.5 ml-1">
                                {help.tips.map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <span className="text-teal-600 font-bold">→</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold mt-2 flex items-center gap-1 group"
                        >
                            Ver tips
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </>
            )}

            {/* Learn More */}
            {help.learnMore && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a
                        href={help.learnMore.href}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group"
                    >
                        {help.learnMore.label}
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            )}

            {/* Arrow pointer */}
            {!inline && (
                <div
                    className={cn(
                        "absolute w-2 h-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rotate-45",
                        position === "right" && "-left-1 top-1/2 -translate-y-1/2",
                        position === "left" && "-right-1 top-1/2 -translate-y-1/2",
                        position === "top" && "-bottom-1 left-1/2 -translate-x-1/2",
                        position === "bottom" && "-top-1 left-1/2 -translate-x-1/2"
                    )}
                />
            )}
        </div>
    )
}
