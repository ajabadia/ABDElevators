'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores.
 * @param value Valor a debouncing
 * @param delay Tiempo de espera en ms (default 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
