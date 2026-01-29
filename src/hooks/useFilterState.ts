import { useState, useCallback, useMemo } from 'react';

interface UseFilterStateOptions<T> {
    initialFilters: T;
    onFilterChange?: (filters: T) => void;
}

/**
 * Hook para gestionar el estado de los filtros de forma centralizada.
 * Simplifica el reset de paginación y la limpieza de filtros.
 */
export function useFilterState<T extends Record<string, any>>({
    initialFilters,
    onFilterChange
}: UseFilterStateOptions<T>) {
    const [filters, setFilters] = useState<T>(initialFilters);
    const [page, setPage] = useState(1);

    const setFilter = useCallback((key: keyof T, value: any) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // Al cambiar un filtro (que no sea la página), volvemos a la página 1
            if (key !== 'page' && key !== 'limit') {
                setPage(1);
            }
            onFilterChange?.(next);
            return next;
        });
    }, [onFilterChange]);

    const setBulkFilters = useCallback((newFilters: Partial<T>) => {
        setFilters(prev => {
            const next = { ...prev, ...newFilters };
            setPage(1);
            onFilterChange?.(next);
            return next;
        });
    }, [onFilterChange]);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
        setPage(1);
        onFilterChange?.(initialFilters);
    }, [initialFilters, onFilterChange]);

    // Combinar filtros con estado de paginación para enviar a la API
    const activeFilters = useMemo(() => ({
        ...filters,
        page,
    }), [filters, page]);

    return {
        filters,
        activeFilters, // Usado por useApiList
        page,
        setPage,
        setFilter,
        setBulkFilters,
        clearFilters
    };
}
