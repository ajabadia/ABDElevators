'use client';

import { useMemo, useCallback } from 'react';
import { getEntityEngine } from '@/core/engine';
import { EntityDefinition } from '@/core/engine/EntityEngine';
import { useApiItem } from './useApiItem';
import { useApiMutation } from './useApiMutation';
import { Entity } from '@/lib/schemas';
import { toast } from 'sonner';

/**
 * Hook unificado para interactuar con entidades del dominio industrial.
 * Proporciona metadatos (ontología) y datos (instancia).
 */
export function useEntity(type: string, id?: string) {
    const engine = getEntityEngine();

    // 1. Obtener definición de la ontología
    const definition = useMemo(() => engine.getEntity(type), [type, engine]);

    // 2. Fetch de la instancia (si hay ID)
    // El endpoint canónico es /api/core/entities/[type]/[id]
    const {
        data: entity,
        isLoading,
        error,
        refresh,
        setData: setEntity
    } = useApiItem<Entity>({
        endpoint: `/api/core/entities/${type}/${id}`,
        autoFetch: !!id,
        dataKey: 'entity' // El API canónico devuelve { success: true, entity: ... }
    });

    // 3. Mutación para Transiciones de Estado
    const { mutate: executeTransition, isLoading: isTransitioning } = useApiMutation<
        { toState: string },
        { success: boolean, newState: string }
    >({
        endpoint: `/api/core/entities/${type}/${id}/transition`,
        method: 'POST',
        onSuccess: (result) => {
            if (entity) {
                setEntity({ ...entity, status: result.newState });
            }
        },
        successMessage: (res) => `Estado actualizado a ${res.newState}`
    });

    // 4. Mutación para Análisis Inteligente
    const { mutate: triggerAnalysis, isLoading: isAnalyzing } = useApiMutation<
        void,
        { success: boolean, jobId: string }
    >({
        endpoint: `/api/core/entities/${type}/${id}/analyze`,
        method: 'POST',
        successMessage: 'Análisis iniciado correctamente'
    });

    // 5. Mutación para Validación Humana
    const { mutate: validate, isLoading: isValidating } = useApiMutation<
        { items: any[], generalStatus: string, validationTime: number, observations?: string },
        { success: boolean }
    >({
        endpoint: `/api/core/entities/${type}/${id}/validate`,
        method: 'POST',
        onSuccess: () => {
            refresh(); // Recargar datos tras validar
        },
        successMessage: 'Validación guardada correctamente'
    });

    return {
        definition,
        entity,
        isLoading,
        error,
        refresh,
        setEntity,
        // Helpers de negocio
        transitionTo: (toState: string) => executeTransition({ toState }),
        analyze: () => triggerAnalysis(),
        validate: (data: any) => validate(data),
        isTransitioning,
        isAnalyzing,
        isValidating
    };
}

