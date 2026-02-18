import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { AuditLogQuerySchema } from '@/lib/schemas/audit-logs';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/audit/logs
 * Permite a los administradores consultar el historial de auditoría de su tenant.
 * Implementa Regla de Oro #2 (Zod) y #11 (SecureCollection).
 */
export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        // Harmonized Permission: Both ADMIN and SUPER_ADMIN can view logs.
        // SuperAdmin can see everything (handled by SecureCollection bypass logic).
        // Admin can only see their tenant's logs (handled by SecureCollection filter).
        const userRole = session.user.role;
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Requiere privilegios de administrador');
        }

        const { searchParams } = new URL(request.url);

        // 🛡️ Regla de Oro #2: Validación Zod ANTES de procesar
        const { limit, search, level, source, type, correlationId: filterCorrelationId } = AuditLogQuerySchema.parse(
            Object.fromEntries(searchParams.entries())
        );

        // Map unified 'type' to collection names
        const collectionMap: Record<string, string[]> = {
            'APPLICATION': ['application_logs'],
            'CONFIG': ['audit_config_changes'],
            'ADMIN': ['audit_admin_ops'],
            'ACCESS': ['audit_data_access'],
            'SECURITY': ['audit_security_events'],
            'ALL': ['application_logs', 'audit_config_changes', 'audit_admin_ops', 'audit_data_access', 'audit_security_events']
        };

        const targetCollections = collectionMap[type] || ['application_logs'];
        let allLogs: any[] = [];

        // For Forensic purposes, we might need to search across multiple collections
        for (const colName of targetCollections) {
            const collection = await getTenantCollection<any>(colName, session, 'LOGS');

            const query: any = {};
            if (level !== 'ALL' && colName === 'application_logs') query.level = level;
            if (source !== 'ALL') query.source = source;
            if (filterCorrelationId) query.correlationId = filterCorrelationId;

            if (search) {
                query.$or = [
                    { message: { $regex: search, $options: 'i' } },
                    { action: { $regex: search, $options: 'i' } },
                    { userEmail: { $regex: search, $options: 'i' } },
                    { actorId: { $regex: search, $options: 'i' } }
                ];
            }

            const logs = await collection.find(query, {
                sort: { timestamp: -1 },
                limit
            });

            // Map standard logs to display format if needed
            const normalized = logs.map(l => ({
                ...l,
                _originalCollection: colName,
                // Ensure level exists for specialized logs
                level: l.level || (colName.includes('security') ? 'WARN' : 'INFO')
            }));

            allLogs = [...allLogs, ...normalized];
        }

        // Sort aggregated results by timestamp
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Final limit after aggregation
        const limitedLogs = allLogs.slice(0, limit);

        return NextResponse.json({
            success: true,
            data: limitedLogs,
            correlationId
        });

    } catch (error) {
        return handleApiError(error, 'API_AUDIT_LOGS', correlationId);
    }
}

