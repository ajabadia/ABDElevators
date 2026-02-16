"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTranslations } from 'next-intl'

export interface Step {
    target: string
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingState {
    completed: boolean
    completeOnboarding: () => void
    resetOnboarding: () => void
}

const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            completed: false,
            completeOnboarding: () => set({ completed: true }),
            resetOnboarding: () => set({ completed: false }),
        }),
        {
            name: 'onboarding-storage',
        }
    )
)

export function useOnboarding() {
    const [isActive, setIsActive] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const pathname = usePathname()
    const { completed: hasCompletedOnboarding, completeOnboarding } = useOnboardingStore()
    const t = useTranslations("common.onboarding.steps")

    const getSteps = (path: string): Step[] => {
        if (path === '/search') {
            return [
                {
                    target: 'h3.font-bold',
                    title: 'search_title',
                    content: 'search_content',
                    position: 'bottom'
                },
                {
                    target: 'input[type="text"]',
                    title: 'input_title',
                    content: 'input_content',
                    position: 'top'
                }
            ]
        }
        if (path === '/admin') {
            return [
                {
                    target: '[data-tour="quick-actions"]',
                    title: 'actions_title',
                    content: 'actions_content',
                    position: 'bottom'
                }
            ]
        }
        return []
    }

    const currentTourStepsRaw = pathname ? getSteps(pathname) : []

    // Map content to translations
    const currentTourSteps = currentTourStepsRaw.map(step => ({
        ...step,
        title: t(step.title),
        content: t(step.content)
    }))

    useEffect(() => {
        if (hasCompletedOnboarding) {
            setIsActive(false)
        } else {
            // Start onboarding automatically for new users if steps exist for current page
            if (pathname && getSteps(pathname).length > 0) {
                setIsActive(true)
            }
        }
    }, [pathname, hasCompletedOnboarding])

    const nextStep = () => {
        if (!pathname) return
        const steps = currentTourSteps
        if (steps && currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            completeOnboarding()
            setIsActive(false)
        }
    }

    const skipOnboarding = () => {
        completeOnboarding()
        setIsActive(false)
    }

    return {
        isActive,
        currentStep: currentTourSteps?.[currentStepIndex],
        totalSteps: currentTourSteps?.length || 0,
        currentStepIndex,
        nextStep,
        skipOnboarding,
        hasCompletedOnboarding
    }
}
