"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

const SUGGESTED_QUERIES = ["q1", "q2", "q3", "q4"];

interface ChatWelcomeProps {
    onQuerySelect: (query: string) => void;
}

/**
 * ChatWelcome — ERA 14 Refactor
 * Renders the welcome screen with suggested queries.
 */
export function ChatWelcome({ onQuerySelect }: ChatWelcomeProps) {
    const t = useTranslations("common.navigation.search");

    return (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800"
            >
                <Sparkles className="w-10 h-10 text-primary opacity-50" />
            </motion.div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                    {t("welcome_title")}
                </h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {t("welcome_desc")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg text-left">
                {SUGGESTED_QUERIES.map((key, i) => (
                    <button
                        key={i}
                        onClick={() => onQuerySelect(t(`suggested.${key}`))}
                        className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between shadow-sm"
                    >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                            {t(`suggested.${key}`)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
}
