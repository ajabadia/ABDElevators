"use client";

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

export function useOnboarding() {
    const [currentStep, setCurrentStep] = useLocalStorage<number>('onboarding-step', 0);
    const [isCompleted, setIsCompleted] = useLocalStorage<boolean>('onboarding-completed', false);
    const [isVisible, setIsVisible] = useState(false);

    const steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: '¡Bienvenido a ABD RAG!',
            content: 'Estamos encantados de tenerte aquí. Vamos a darte un pequeño tour para que conozcas las herramientas clave para gestionar tu documentación técnica.',
            placement: 'bottom',
        },
        {
            id: 'knowledge-assets',
            title: 'Corpus de Documentación',
            content: 'Aquí es donde vive todo el conocimiento. Puedes subir manuales, planos y especificaciones que la IA utilizará para responder tus dudas.',
            target: '[data-tour="knowledge-assets"]',
            placement: 'right',
        },
        {
            id: 'search',
            title: 'Búsqueda Inteligente',
            content: 'Usa la barra de búsqueda para preguntar lo que sea. No necesitas palabras exactas, la IA entiende el contexto técnico de tus manuales.',
            target: '[data-tour="global-search"]',
            placement: 'bottom',
        },
        {
            id: 'intelligence',
            title: 'Inteligencia Técnica',
            content: 'Accede a análisis profundos, tendencias y métricas de calidad de tus activos de conocimiento.',
            target: '[data-tour="intelligence-hub"]',
            placement: 'left',
        },
        {
            id: 'dashboard-actions',
            title: 'Acciones Rápidas',
            content: 'Desde aquí puedes acceder directamente a las funciones más usadas: subir manuales, buscar respuestas o ver tu historial.',
            target: '[data-tour="quick-actions"]',
            placement: 'top',
        }
    ];

    useEffect(() => {
        // Show onboarding if not completed and after a small delay to ensure UI is ready
        if (!isCompleted) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isCompleted]);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsCompleted(true);
            setIsVisible(false);
        }
    }, [currentStep, steps.length, setCurrentStep, setIsCompleted]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep, setCurrentStep]);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step < steps.length) {
            setCurrentStep(step);
        }
    }, [steps.length, setCurrentStep]);

    const skipOnboarding = useCallback(() => {
        setIsCompleted(true);
        setIsVisible(false);
    }, [setIsCompleted]);

    const resetOnboarding = useCallback(() => {
        setIsCompleted(false);
        setCurrentStep(0);
        setIsVisible(true);
    }, [setIsCompleted, setCurrentStep]);

    const progress = Math.round(((currentStep + 1) / steps.length) * 100);

    return {
        steps,
        currentStep,
        isVisible,
        isCompleted,
        nextStep,
        prevStep,
        goToStep,
        skipOnboarding,
        resetOnboarding,
        progress,
        currentStepData: steps[currentStep]
    };
}
