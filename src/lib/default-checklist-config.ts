// src/lib/default-checklist-config.ts
import { ChecklistConfig } from "@/lib/schemas";


/**
 * Default checklist configuration for the first tenant.
 * Includes initial departments: Mantenimiento, Instalación, Ingeniería.
 */
export const defaultChecklistConfig: ChecklistConfig = {
    id: "default_v1",
    title: "Configuración Estándar ABD",
    name: "Configuración Estándar ABD",
    version: 1,
    active: true,
    categories: [
        {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Mantenimiento Preventivo",
            color: "#3b82f6", // Blue
            keywords: ["voltaje", "aceite", "limpieza", "engrase", "inspección"],
            priority: 1
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Instalación Eléctrica",
            color: "#ef4444", // Red
            keywords: ["cableado", "cuadro", "fase", "tierra", "conexión"],
            priority: 2
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440002",
            name: "Ingeniería de Diseño",
            color: "#10b981", // Green
            keywords: ["plano", "dimensiones", "carga", "especificación", "normativa"],
            priority: 3
        }
    ],
    items: [],
    workflowOrder: [
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002"
    ],
    isActive: true,
    tenantId: 'system',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
};

