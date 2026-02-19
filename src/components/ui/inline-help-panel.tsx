"use client"

import React from "react"
import { Lightbulb, ExternalLink, X } from "lucide-react"
import { useContextualHelp } from "@/hooks/useContextualHelp"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

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
    const t = useTranslations("common.help")
    const { getHelp } = useContextualHelp()
    const [isDismissed, setIsDismissed] = React.useState(false)

    if (isDismissed) return null

    return (
        <div className={cn(
            "border border-secondary/20 bg-secondary/5 rounded-2xl p-4 space-y-3 mb-6",
            variant === "full" && "p-6 space-y-4"
        )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-xl shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-foreground">
                            {t("title")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>
                {dismissible && (
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="p-1 hover:bg-secondary/20 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
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
                                    <p className="text-xs font-semibold text-foreground mb-1">
                                        {help.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {help.content}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <span className="font-semibold">{help.title}:</span> {help.content}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Learn More Button */}
            {contextIds.length === 1 && getHelp(contextIds[0])?.learnMore && (
                <div className="pt-2 border-t border-secondary/20">
                    <a
                        href={getHelp(contextIds[0])?.learnMore?.href || "#"}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold group"
                    >
                        {getHelp(contextIds[0])?.learnMore?.label}
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            )}
        </div>
    )
}
