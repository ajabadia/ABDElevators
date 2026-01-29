import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para persistir estado en localStorage con tipado fuerte.
 * Útil para preferencias de usuario y filtros persistentes.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // Estado inicial intentando cargar desde localStorage
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Sincronizar con localStorage cuando el valor cambia
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const remove = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key]);

    return [storedValue, setStoredValue, remove] as const;
}
