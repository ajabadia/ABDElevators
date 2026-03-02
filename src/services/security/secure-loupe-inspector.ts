import { Document, Filter } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * SecureLoupeInspector
 * Restricted search for SuperAdmins with PII redaction.
 */
export class SecureLoupeInspector {

    /**
     * Inspect documents across tenants with redaction.
     */
    static async inspect(session: TenantSession, query: string, collectionName: string): Promise<Record<string, unknown>[]> {
        if (session.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Solo SUPER_ADMIN puede usar el Inspector Loupe');
        }

        const correlationId = `loupe-${Date.now()}`;
        const collection = await getTenantCollection<Document>(collectionName, session);

        // Perform search (limited to 10 for safety)
        const filter: Filter<Document> = { $text: { $search: query } } as Filter<Document>;
        const results = await collection.find(
            filter,
            { limit: 10 }
        );

        // Automatic Redaction
        const redactedResults = results.map(doc => this.redact(doc as unknown as Record<string, unknown>));

        await logEvento({
            level: 'WARN',
            source: 'SECURE_LOUPE',
            action: 'DATA_INSPECTION',
            message: `SuperAdmin performed data inspection on ${collectionName}`,
            tenantId: 'platform_master',
            correlationId,
            details: { query, collectionName, resultCount: results.length }
        });

        return redactedResults;
    }

    /**
     * Primitive PII Redaction logic.
     */
    private static redact(doc: Record<string, unknown>): Record<string, unknown> {
        const sensitiveKeys = ['email', 'phone', 'password', 'secret', 'address', 'dni', 'nif'];
        const redacted = { ...doc };

        for (const key of Object.keys(redacted)) {
            const value = redacted[key];
            if (sensitiveKeys.includes(key.toLowerCase())) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = this.redact(value as Record<string, unknown>);
            }
        }

        return redacted;
    }
}
