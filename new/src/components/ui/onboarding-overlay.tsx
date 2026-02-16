"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";

export function OnboardingOverlay() {
    const {
        isVisible,
        currentStepData,
        nextStep,
        prevStep,
        skipOnboarding,
        progress,
        currentStep,
        steps
    } = useOnboarding();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (isVisible && currentStepData?.target) {
            const element = document.querySelector(currentStepData.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [isVisible, currentStep, currentStepData]);

    if (!isVisible) return null;

    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            {/* Background Dimming with Cutout */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500"
                style={{
                    clipPath: targetRect
                        ? `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
                        : 'none'
                }}
                onClick={skipOnboarding}
            />

            {/* Target Highlight Ring */}
            {targetRect && (
                <div
                    className="absolute border-2 border-teal-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.4)] rounded-xl transition-all duration-500 ease-in-out"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                className={`absolute pointer-events-auto transition-all duration-500 ease-out transform
          bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-[400px]
          ${targetRect ? '' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
        `}
                style={targetRect ? {
                    top: currentStepData.placement === 'bottom' ? targetRect.bottom + 24 :
                        currentStepData.placement === 'top' ? targetRect.top - 200 : targetRect.top,
                    left: currentStepData.placement === 'right' ? targetRect.right + 24 :
                        currentStepData.placement === 'left' ? targetRect.left - 424 : targetRect.left,
                } : undefined}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-teal-500/10 rounded-lg text-teal-600">
                            <Sparkles size={18} />
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white tracking-tight">
                            {currentStepData.title}
                        </h3>
                    </div>
                    <button
                        onClick={skipOnboarding}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {currentStepData.content}
                </p>

                <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-teal-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Paso {currentStep + 1} de {steps.length}
                        </span>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevStep}
                                    className="rounded-xl text-xs font-bold gap-1"
                                >
                                    <ChevronLeft size={16} /> Anterior
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={nextStep}
                                className={`rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 px-6 ${isLastStep ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-600 hover:bg-teal-700'
                                    }`}
                            >
                                {isLastStep ? (
                                    <>¡Entendido! <CheckCircle2 size={16} className="ml-2" /></>
                                ) : (
                                    <>Siguiente <ChevronRight size={16} className="ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
