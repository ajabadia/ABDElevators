"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '@/hooks/use-onboarding'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function OnboardingOverlay() {
    const { isActive, currentStep, nextStep, skipOnboarding, currentStepIndex, totalSteps } = useOnboarding()
    const t = useTranslations("common.onboarding")

    if (!isActive || !currentStep) return null

    // We need to find the target element to position the tooltip
    // For a real implementation, we might use a library like react-joyride or floating-ui
    // For this custom simplified version, we'll center it or try to find coordinates.
    // To keep it robust without complex math, we'll use a fixed centered modal or simple positioning logic.
    // FOR PHASE 96 MVP: Centered Bottom Modal style is safer and cleaner than precise coordinate calculations without a library.

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center pb-12 px-4">
                {/* Backdrop highlight attempt - simplified for MVP to just be a modal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto max-w-md w-full relative"
                >
                    <button
                        onClick={skipOnboarding}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                                {t("step_counter", { current: currentStepIndex + 1, total: totalSteps })}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {currentStep.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {currentStep.content}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" size="sm" onClick={skipOnboarding} className="text-slate-500">
                                {t("skip")}
                            </Button>
                            <Button onClick={nextStep} className="bg-teal-600 hover:bg-teal-700 text-white">
                                {currentStepIndex === totalSteps - 1 ? t("finish") : t("next")}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
