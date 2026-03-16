import { getErrorMessage } from '@/lib/errors-helpers';
import { IAuditRepository, AuditLogFilters } from '../../domain/repositories/IAuditRepository';
import { AppError } from '@/lib/errors';
import 'server-only';

export class ListAuditLogsUseCase {
    constructor(private auditRepository: IAuditRepository) { }

    async execute(filters: AuditLogFilters) {
        try {
            return await this.auditRepository.listLogs(filters);
        } catch (error: unknown) {
            throw new AppError('DATABASE_ERROR', 500, 'Error listing audit logs', { originalError: getErrorMessage(error) });
        }
    }
}
