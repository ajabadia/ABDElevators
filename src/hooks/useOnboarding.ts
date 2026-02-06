import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

export function useOnboarding() {
    const [currentStep, setCurrentStepState] = useState(0);
    const [isCompleted, setIsCompletedState] = useState(true); // Default to true until checked
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await fetch('/api/user/preferences');
                const data = await res.json();
                if (data.success && data.preferences?.onboarding) {
                    setCurrentStepState(data.preferences.onboarding.currentStep || 0);
                    setIsCompletedState(data.preferences.onboarding.completed);
                }
            } catch (error) {
                console.error('Failed to fetch onboarding state:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrefs();
    }, []);

    useEffect(() => {
        // Show onboarding if not completed and after a small delay to ensure UI is ready
        if (!isLoading && !isCompleted) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, isLoading]);

    const syncWithServer = async (newState: { completed?: boolean, currentStep?: number }) => {
        try {
            await fetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboarding: newState })
            });
        } catch (error) {
            console.error('Failed to sync onboarding state:', error);
        }
    };

    const nextStep = useCallback(async () => {
        if (currentStep < steps.length - 1) {
            const next = currentStep + 1;
            setCurrentStepState(next);
            await syncWithServer({ currentStep: next });
        } else {
            setIsCompletedState(true);
            setIsVisible(false);
            await syncWithServer({ completed: true });
            toast.success('¡Tour completado!');
        }
    }, [currentStep, steps.length]);

    const prevStep = useCallback(async () => {
        if (currentStep > 0) {
            const prev = currentStep - 1;
            setCurrentStepState(prev);
            await syncWithServer({ currentStep: prev });
        }
    }, [currentStep]);

    const skipOnboarding = useCallback(async () => {
        setIsCompletedState(true);
        setIsVisible(false);
        await syncWithServer({ completed: true });
    }, []);

    const resetOnboarding = useCallback(async () => {
        setIsCompletedState(false);
        setCurrentStepState(0);
        setIsVisible(true);
        await syncWithServer({ completed: false, currentStep: 0 });
        toast.info('Tour reiniciado');
    }, []);

    const progress = Math.round(((currentStep + 1) / steps.length) * 100);

    return {
        steps,
        currentStep,
        isVisible,
        isCompleted,
        isLoading,
        nextStep,
        prevStep,
        skipOnboarding,
        resetOnboarding,
        progress,
        currentStepData: steps[currentStep]
    };
}
