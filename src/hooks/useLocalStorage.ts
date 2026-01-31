import { useState, useEffect, useCallback } from 'react';

/**
 * Hook estandarizado para persistencia en LocalStorage.
 * NOTA: No usar para datos sensibles.
 * Incluye gestión de errores segura para entornos Serverless/SSG.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // Estado para almacenar nuestro valor
    // Pasamos una función de inicialización para que solo se ejecute una vez
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // useEffect para cargar el valor inicial desde localStorage una vez montado el componente
    // Esto evita discrepancias en la hidratación (Hydration Mismatch)
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;

            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
    }, [key]);

    // Retornamos una versión envuelta de setter que persiste en localStorage
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Permitir que el valor sea una función para que tengamos el mismo API que useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Guardar estado
            setStoredValue(valueToStore);

            // Guardar en local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
}
