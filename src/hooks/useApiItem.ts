'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getCsrfToken } from 'next-auth/react';

interface UseApiItemOptions<T, R = any> {
    endpoint: string | (() => string);
    autoFetch?: boolean;
    initialData?: T | null;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    dataKey?: string;
    transform?: (raw: R) => T;
}

/**
 * Hook para gestionar un único recurso desde la API.
 * Implementa el patrón "Zero-Leak" con isMounted y AbortController.
 * v412: Soporta initialData para evitar waterfalls.
 */
export function useApiItem<T, R = any>({
    endpoint,
    autoFetch = true,
    initialData = null,
    onSuccess,
    onError,
    dataKey,
    transform
}: UseApiItemOptions<T, R>) {
    const [data, setData] = useState<T | null>(initialData);
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

    // Estabilizar callbacks
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const fetchData = useCallback(async () => {
        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);

        try {
            const finalEndpoint = typeof endpoint === 'function' ? endpoint() : endpoint;
            const csrfToken = await getCsrfToken();
            const res = await fetch(finalEndpoint, {
                signal: controller.signal,
                headers: {
                    'X-CSRF-Token': csrfToken || ''
                }
            });

            const text = await res.text();

            if (!res.ok) {
                // If it's not JSON, provide a cleaner error than the raw HTML
                if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
                    throw new Error(`API Error (${res.status}): El servidor devolvió una página HTML en lugar de datos.`);
                }

                let errorData: any;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    throw new Error(`Error del servidor (${res.status}): ${text.slice(0, 50)}...`);
                }
                throw new Error(errorData?.message || errorData?.error?.message || `Error ${res.status} al cargar el recurso`);
            }

            let json: any;
            try {
                json = JSON.parse(text);
            } catch (pErr) {
                throw new Error(`Respuesta inválida del servidor: No se pudo procesar el formato de datos.`);
            }

            if (json && json.success === false) {
                throw new Error(json?.message || json?.error?.message || 'Error al cargar el recurso');
            }

            const item = (dataKey && json && typeof json === 'object' && dataKey in json)
                ? json[dataKey]
                : (json?.data || json?.item || json?.definition || json?.config || json);
            const finalData = transform ? transform(item) : item;

            if (isMounted.current) {
                setData(finalData);
                onSuccessRef.current?.(finalData);
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;

            const message = err instanceof Error ? err.message : 'Error desconocido';
            if (isMounted.current) {
                setError(message);
                toast.error('Error de Carga', { description: message });
                onErrorRef.current?.(message);
            }
        } finally {
            if (isMounted.current && abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [endpoint, dataKey, transform]);

    useEffect(() => {
        if (autoFetch && !initialData) {
            fetchData();
        }
    }, [autoFetch, fetchData, initialData]);

    const refresh = useCallback(() => {
        return fetchData();
    }, [fetchData]);

    return {
        data,
        setData,
        isLoading,
        error,
        refresh
    };
}
