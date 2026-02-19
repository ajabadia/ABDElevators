import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

export interface HelpTooltip {
    id: string;
    title: string;
    content: string;
    example?: string;
    tips?: string[];
    learnMore?: {
        label: string;
        href: string;
    };
}

/**
 * Hook provide contextual help data indexed by contextId.
 * Now fully i18n compatible.
 */
export function useContextualHelp() {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const t = useTranslations("common.help.contexts");

    const getHelp = useCallback((contextId: string): HelpTooltip | null => {
        try {
            // Check if context exists in i18n
            if (!t.has(`${contextId}.title`)) return null;

            return {
                id: contextId,
                title: t(`${contextId}.title`),
                content: t(`${contextId}.content`),
                example: t.has(`${contextId}.example`) ? t(`${contextId}.example`) : undefined,
                tips: t.has(`${contextId}.tips`) ? t.raw(`${contextId}.tips`) : undefined,
                learnMore: t.has(`${contextId}.learnMore.label`) ? {
                    label: t(`${contextId}.learnMore.label`),
                    href: t(`${contextId}.learnMore.href`)
                } : undefined
            };
        } catch (error) {
            console.warn(`[HelpContext] Failed to load help for ${contextId}`, error);
            return null;
        }
    }, [t]);

    const toggleHelp = useCallback((contextId: string) => {
        setActiveTooltip(prev => prev === contextId ? null : contextId);
    }, []);

    const closeHelp = useCallback(() => {
        setActiveTooltip(null);
    }, []);

    return {
        getHelp,
        toggleHelp,
        closeHelp,
        activeTooltip
    };
}

