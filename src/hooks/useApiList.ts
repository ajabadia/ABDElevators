'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';

interface UseApiListOptions<T> {
    endpoint: string;
    filters?: Record<string, any>;
    dataKey?: string; // e.g. 'prompts', 'tickets', 'items'
    autoFetch?: boolean;
    initialData?: T[];
    onSuccess?: (data: T[]) => void;
    onError?: (error: string) => void;
    transform?: (item: any) => T;
    debounceMs?: number;
    onFilterChange?: () => void;
}

/**
 * Hook avanzado para gestionar listas de datos desde la API.
 * Soporta filtros, debouncing, loading states y transformaciones.
 * Implementa el patrón "Zero-Leak" con isMounted y AbortController.
 * v412: Soporta initialData para evitar waterfalls.
 */
export function useApiList<T>({
    endpoint,
    filters: rawFilters = {},
    dataKey = 'items',
    autoFetch = true,
    initialData = [],
    onSuccess,
    onError,
    transform,
    debounceMs = 300,
    onFilterChange
}: UseApiListOptions<T>) {
    const [data, setData] = useState<T[]>(initialData);
    const [total, setTotal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Ciclo de vida para el patrón Zero-Leak
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Estabilizar filtros para evitar bucles infinitos por objetos literales
    const filters = useMemo(() => rawFilters, [JSON.stringify(rawFilters)]);

    // Usar Refs para callbacks para evitar que recrear fetchData cause bucles
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const transformRef = useRef(transform);
    const onFilterChangeRef = useRef(onFilterChange);

    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { transformRef.current = transform; }, [transform]);
    useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

    // Para manejar el debounce de los filtros
    const filtersRef = useRef(filters);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async (currentFilters: Record<string, any>) => {
        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Nuevo controlador
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });

            const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

            const res = await fetch(url, { signal: controller.signal });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || json.error?.message || 'Error al cargar los datos');
            }

            // Intentar encontrar la lista de datos basada en dataKey o por convención
            let items = json[dataKey];

            // Si no está en esa key, buscar la primera key que sea un array
            if (!items) {
                const firstArrayKey = Object.keys(json).find(k => Array.isArray(json[k]));
                if (firstArrayKey) items = json[firstArrayKey];
            }

            if (!Array.isArray(items)) {
                items = [];
            }

            const transformedItems = transformRef.current ? items.map(transformRef.current) : items;

            if (isMounted.current) {
                setData(transformedItems);

                // Extraer total si existe (pagination.total o total)
                const resolvedTotal = json.pagination?.total ?? json.total ?? null;
                setTotal(resolvedTotal);

                onSuccessRef.current?.(transformedItems);
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Ignorar cancelaciones
            }
            const message = err instanceof Error ? err.message : 'Error desconocido';

            if (isMounted.current) {
                setError(message);
                toast.error(message);
                onErrorRef.current?.(message);
            }
        } finally {
            // Solo limpiar loading si este es el request activo y estamos montados
            if (isMounted.current && abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [endpoint, dataKey]);

    // Efecto para fetch inicial y cambios de filtros con debounce
    useEffect(() => {
        if (!autoFetch) return;

        // Comparamos si los filtros han cambiado realmente
        const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(filters);

        if (filtersChanged) {
            onFilterChangeRef.current?.();
        }

        filtersRef.current = filters;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (filtersChanged) {
            debounceTimerRef.current = setTimeout(() => {
                fetchData(filters);
            }, debounceMs);
        } else if (data.length === 0 && initialData.length === 0 && !isLoading && !error) {
            // Carga inicial solo si no hay datos ni estamos cargando
            fetchData(filters);
        }

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [filters, autoFetch, fetchData, debounceMs]); // eliminamos onFilterChange

    const refresh = useCallback(() => {
        return fetchData(filters);
    }, [fetchData, filters]);

    return {
        data,
        total,
        isLoading,
        error,
        refresh,
        setData // Útil para actualizaciones optimistas manuales
    };
}
