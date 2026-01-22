// src/lib/default-checklist-config.ts
import { ChecklistConfig } from "@/lib/schemas";


/**
 * Default checklist configuration for the first tenant.
 * Includes initial departments: Mantenimiento, Instalación, Ingeniería.
 */
export const defaultChecklistConfig: ChecklistConfig = {
    nombre: "Configuración Estándar ABD",
    categorias: [
        {
            id: "550e8400-e29b-41d4-a716-446655440000",
            nombre: "Mantenimiento Preventivo",
            color: "#3b82f6", // Blue
            keywords: ["voltaje", "aceite", "limpieza", "engrase", "inspección"],
            prioridad: 1,
            icono: "Wrench"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440001",
            nombre: "Instalación Eléctrica",
            color: "#ef4444", // Red
            keywords: ["cableado", "cuadro", "fase", "tierra", "conexión"],
            prioridad: 2,
            icono: "Zap"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440002",
            nombre: "Ingeniería de Diseño",
            color: "#10b981", // Green
            keywords: ["plano", "dimensiones", "carga", "especificación", "normativa"],
            prioridad: 3,
            icono: "FileText"
        }
    ],
    workflow_orden: [
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002"
    ],
    activo: true,
    tenantId: 'system',
    creado: new Date('2026-01-01'),
    actualizado: new Date('2026-01-01')
};

