/**
 * Utility to map technical ingest states to user-friendly business states.
 * FASE 253: Operational Clarity
 */

export type TechnicalIngestState =
    | 'PENDING'
    | 'STORED_NO_INDEX'
    | 'INDEXED_NO_STORAGE'
    | 'PARTIAL'
    | 'COMPLETED'
    | 'FAILED'
    | 'STUCK';

export interface BusinessStateInfo {
    label: string;
    color: string; // Tailwind color class
    description: string;
}

export const INGEST_STATE_MAPPING: Record<TechnicalIngestState, BusinessStateInfo> = {
    PENDING: {
        label: 'En espera',
        color: 'text-gray-500',
        description: 'El documento está en cola para procesar.'
    },
    STORED_NO_INDEX: {
        label: 'Procesando',
        color: 'text-blue-500',
        description: 'Documento guardado, extrayendo información...'
    },
    INDEXED_NO_STORAGE: {
        label: 'Procesando',
        color: 'text-blue-500',
        description: 'Información extraída, guardando permanencia...'
    },
    PARTIAL: {
        label: 'Procesando',
        color: 'text-blue-500',
        description: 'En proceso de finalización.'
    },
    COMPLETED: {
        label: 'Completado',
        color: 'text-green-500',
        description: 'Documento procesado correctamente.'
    },
    FAILED: {
        label: 'Fallido',
        color: 'text-red-500',
        description: 'El procesamiento ha fallado definitivamente.'
    },
    STUCK: {
        label: 'Requiere atención',
        color: 'text-amber-500',
        description: 'El proceso parece detenido. El sistema lo intentará de nuevo.'
    }
};

/**
 * Get high-level business state info from a technical state.
 */
export function getBusinessState(technicalState: string): BusinessStateInfo {
    const state = technicalState.toUpperCase() as TechnicalIngestState;
    return INGEST_STATE_MAPPING[state] || {
        label: technicalState,
        color: 'text-gray-400',
        description: 'Estado desconocido.'
    };
}
