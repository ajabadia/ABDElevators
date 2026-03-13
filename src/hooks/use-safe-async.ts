import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🛡️ [SECURITY] Hardening Wave 3: Safe Async Hook
 * Prevents memory leaks by checking if the component is mounted before state updates.
 * Also provides an AbortController for cleaning up fetches.
 */
export function useSafeAsync() {
    const isMounted = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    const safeExecute = useCallback(async <T>(
        promise: Promise<T>,
        onSuccess: (data: T) => void,
        onError?: (error: Error) => void
    ) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const data = await promise;
            if (isMounted.current && !controller.signal.aborted) {
                onSuccess(data);
            }
        } catch (error) {
            if (isMounted.current && !controller.signal.aborted) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    onError?.(error);
                }
            }
        }
    }, []);

    return { safeExecute, isMounted };
}
