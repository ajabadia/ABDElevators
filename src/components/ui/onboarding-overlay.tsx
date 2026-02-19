"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { Button } from "@/components/ui/button";
import { OnboardingWelcomeStep } from "@/components/onboarding/OnboardingWelcomeStep";
import { OnboardingUploadStep } from "@/components/onboarding/OnboardingUploadStep";
import { OnboardingQuestionStep } from "@/components/onboarding/OnboardingQuestionStep";
import { OnboardingExploreStep } from "@/components/onboarding/OnboardingExploreStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

export function OnboardingOverlay() {
    const {
        isVisible,
        currentStep,
        progress,
        prevStep,
        skipOnboarding
    } = useOnboardingContext();

    const { steps } = useOnboarding();
    const currentStepData = steps[currentStep];

    if (!isVisible) return null;

    const renderStepContent = () => {
        switch (currentStepData.id) {
            case "welcome": return <OnboardingWelcomeStep />;
            case "upload": return <OnboardingUploadStep />;
            case "ask": return <OnboardingQuestionStep />;
            case "explore": return <OnboardingExploreStep />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden"
            >
                {/* Header / Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary/20">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </div>

                <div className="p-8 pb-10">
                    {/* Top actions */}
                    <div className="flex items-center justify-between mb-8">
                        {currentStep > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevStep}
                                className="h-8 -ml-2 text-muted-foreground hover:text-foreground gap-1 pr-3"
                            >
                                <ChevronLeft size={16} />
                                Volver
                            </Button>
                        ) : (
                            <div className="h-8" />
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={skipOnboarding}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <motion.h2
                                key={currentStepData.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-2xl font-bold tracking-tight text-foreground"
                            >
                                {currentStepData.title}
                            </motion.h2>
                            <motion.p
                                key={currentStepData.content}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-sm text-muted-foreground"
                            >
                                {currentStepData.content}
                            </motion.p>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer / Meta info */}
                <div className="px-8 py-4 bg-secondary/5 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-500",
                                    i === currentStep ? "w-4 bg-primary" : "bg-border"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
