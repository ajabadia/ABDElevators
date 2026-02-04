"use client"

import React from "react"
import { Lightbulb, ExternalLink, X } from "lucide-react"
import { useContextualHelp } from "@/hooks/useContextualHelp"
import { cn } from "@/lib/utils"

interface InlineHelpPanelProps {
    contextIds: string[]
    variant?: "compact" | "full"
    dismissible?: boolean
}

export function InlineHelpPanel({
    contextIds,
    variant = "compact",
    dismissible = true
}: InlineHelpPanelProps) {
    const { getHelp } = useContextualHelp()
    const [isDismissed, setIsDismissed] = React.useState(false)

    if (isDismissed) return null

    return (
        <div className={cn(
            "border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 space-y-3 mb-6",
            variant === "full" && "p-6 space-y-4"
        )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-blue-900 dark:text-blue-300">
                            💡 Ayuda Rápida
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                            Consejos útiles sobre esta sección
                        </p>
                    </div>
                </div>
                {dismissible && (
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-4 h-4 text-blue-600" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="space-y-2">
                {contextIds.map(contextId => {
                    const help = getHelp(contextId)
                    if (!help) return null

                    return (
                        <div key={help.id} className="ml-10">
                            {variant === "full" ? (
                                <>
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                        {help.title}
                                    </p>
                                    <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                                        {help.content}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                                    <span className="font-semibold">{help.title}:</span> {help.content}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Learn More Button */}
            {contextIds.length === 1 && getHelp(contextIds[0])?.learnMore && (
                <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30">
                    <a
                        href={getHelp(contextIds[0])?.learnMore?.href || "#"}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold group"
                    >
                        {getHelp(contextIds[0])?.learnMore?.label}
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            )}
        </div>
    )
}
