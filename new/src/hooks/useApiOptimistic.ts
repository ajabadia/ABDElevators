import { useCallback } from 'react';

interface Identifiable {
    id?: string | number;
    _id?: string | number;
}

/**
 * Hook para facilitar actualizaciones optimistas en listas gestionadas por useApiList.
 * Permite modificar el estado local antes de que la API confirme, 
 * mejorando la percepción de velocidad (UX Instantánea).
 */
export function useApiOptimistic<T extends Identifiable>(
    data: T[],
    setData: (data: T[]) => void
) {
    /**
     * Actualiza un elemento de la lista localmente.
     */
    const updateOptimistic = useCallback((id: string | number, updates: Partial<T>) => {
        const nextData = data.map(item => {
            const itemId = item._id || item.id;
            if (itemId === id) {
                return { ...item, ...updates };
            }
            return item;
        });
        setData(nextData);
    }, [data, setData]);

    /**
     * Elimina un elemento de la lista localmente.
     */
    const deleteOptimistic = useCallback((id: string | number) => {
        const nextData = data.filter(item => {
            const itemId = item._id || item.id;
            return itemId !== id;
        });
        setData(nextData);
    }, [data, setData]);

    /**
     * Añade un elemento al principio de la lista localmente.
     */
    const addOptimistic = useCallback((newItem: T) => {
        setData([newItem, ...data]);
    }, [data, setData]);

    return {
        updateOptimistic,
        deleteOptimistic,
        addOptimistic
    };
}
