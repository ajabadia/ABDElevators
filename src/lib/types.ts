/**
 * Shared interfaces for the RAG and Checklist modules.
 */

export type IndustryType = 'ELEVATORS' | 'LEGAL' | 'IT' | 'GENERIC';

export interface GenericCase {
    id: string;
    tenantId: string;
    industry: IndustryType;
    type: string; // e.g., "Mantenimiento", "Demanda", "Ticket"
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: string; // Estado dentro del workflow custom del tenant
    metadata: {
        industry_specific: Record<string, any>;
        tags: string[];
    };
    creado: Date;
    actualizado: Date;
}

export interface ChecklistItem {
    id: string;
    description: string;
    categoryId?: string | null;
    notes?: string;
}

export interface ChecklistCategory {
    id: string;
    nombre: string;
    color: string;
    keywords: string[];
    prioridad: number;
    icono?: string;
}

export interface ChecklistConfig {
    nombre: string;
    categorias: ChecklistCategory[];
    workflow_orden: string[];
    activo: boolean;
}
