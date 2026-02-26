import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { WorkContext } from '@/lib/work-context';
import { useTranslations } from 'next-intl';

export interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

export function useOnboarding() {
    const t = useTranslations('admin.onboarding');
    const [currentStep, setCurrentStepState] = useState(0);
    const [isCompleted, setIsCompletedState] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userContext, setUserContextState] = useState<WorkContext | undefined>(undefined);

    const steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: t('steps.welcome.title'),
            content: t('steps.welcome.content'),
            placement: 'bottom',
        },
        {
            id: 'upload',
            title: t('steps.upload.title'),
            content: t('steps.upload.content'),
            target: '[data-tour="upload-zone"]',
            placement: 'bottom',
        },
        {
            id: 'ask',
            title: t('steps.ask.title'),
            content: t('steps.ask.content'),
            target: '[data-tour="global-search"]',
            placement: 'bottom',
        },
        {
            id: 'explore',
            title: t('steps.explore.title'),
            content: t('steps.explore.content'),
            placement: 'bottom',
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
                    setUserContextState(data.preferences.onboarding.userContext);
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
        if (!isLoading && !isCompleted) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, isLoading]);

    const syncWithServer = async (newState: { completed?: boolean, currentStep?: number, userContext?: WorkContext }) => {
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

    const setUserContext = useCallback(async (context: WorkContext) => {
        setUserContextState(context);
        const next = currentStep + 1;
        setCurrentStepState(next);
        await syncWithServer({ userContext: context, currentStep: next });
    }, [currentStep]);

    const nextStep = useCallback(async () => {
        if (currentStep < steps.length - 1) {
            const next = currentStep + 1;
            setCurrentStepState(next);
            await syncWithServer({ currentStep: next });
        } else {
            setIsCompletedState(true);
            setIsVisible(false);
            await syncWithServer({ completed: true });
            toast.success(t('toasts.completed'));
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
        toast.info(t('toasts.reset'));
    }, []);

    const progress = Math.round(((currentStep + 1) / steps.length) * 100);

    return {
        steps,
        currentStep: steps[currentStep], // Object (for backward compatibility)
        currentStepIndex: currentStep, // Index
        totalSteps: steps.length,
        currentStepData: steps[currentStep], // Modern naming
        isActive: isVisible,
        isVisible,
        isCompleted,
        isLoading,
        userContext,
        setUserContext,
        nextStep,
        prevStep,
        skipOnboarding,
        resetOnboarding,
        progress,
    };
}

