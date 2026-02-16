import { z } from 'zod';

/**
 * CursorPaginationSchema: Estándar para paginación estable y escalable.
 * Fase 71: Escalabilidad & Resiliencia Operativa.
 */
export const CursorPaginationSchema = z.object({
    cursor: z.string().optional().describe('ID del último elemento de la página anterior (Base64 o String)'),
    limit: z.coerce.number().min(1).max(100).default(20),
    direction: z.enum(['forward', 'backward']).default('forward'),
    sortField: z.string().default('_id'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CursorPagination = z.infer<typeof CursorPaginationSchema>;

/**
 * Helper para generar el filtro de MongoDB basado en el esquema de cursor.
 */
export function getCursorFilter(pagination: CursorPagination) {
    if (!pagination.cursor) return {};

    const { cursor, sortField, sortOrder } = pagination;

    // Simplificación: Asumiendo que el cursor es el valor del campo de ordenación (ej: _id o createdAt)
    const operator = sortOrder === 'desc' ? '$lt' : '$gt';

    return {
        [sortField]: { [operator]: cursor.includes('-') ? cursor : cursor } // Ajustar si es ObjectId
    };
}
