/**
 * ⚡ FASE 182/183: Domain Decoupling
 * 🛡️ [SECURITY] Hardening Wave 2: Secure Collection Wrapper
 * Encapsulates @abd/platform-core/server with automatic NoSQL Sanitization.
 */
import { getTenantCollection as getCoreTenantCollection } from '@abd/platform-core/server';
import { MongoSanitizer } from './mongo-sanitizer';
import { Collection } from 'mongodb';

export * from '@abd/platform-core/server';

const VALID_COLLECTION_NAMES = /^[a-z0-9_]+$/i;

/**
 * 🛡️ Wraps getTenantCollection to return a collection with sanitized inputs.
 * Ensures NoSQL injection protection is applied by default.
 */
export async function getTenantCollection<T extends import('mongodb').Document>(
    collectionName: string,
    session: { user: { id: string; tenantId: string; role: string } },
    cluster: 'AUTH' | 'MAIN' | 'LOGS' | 'CONFIG' = 'MAIN'
): Promise<Collection<T>> {
    // 🛡️ [P1] Collection Name Injection Protection (Wave 3)
    if (!VALID_COLLECTION_NAMES.test(collectionName)) {
        throw new Error(`Invalid collection name: ${collectionName}`);
    }

    const collection = await getCoreTenantCollection<T>(collectionName, session as any, cluster);

    // Proxy the collection to intercept query methods
    return new Proxy(collection, {
        get(target, prop, receiver) {
            const original = (target as any)[prop];
            if (typeof original !== 'function') return original;

            // Methods that return a Promise in the original driver
            const asyncFilterMethods = ['find', 'aggregate', 'findOne', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'replaceOne', 'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate'];
            const distinctMethod = 'distinct';

            if (asyncFilterMethods.includes(prop as string)) {
                return async (...args: unknown[]) => {
                    const tenantId = session.user.tenantId;
                    
                    if (prop === 'find' || prop === 'findOne') {
                        const filter = (args[0] || {}) as Record<string, any>;
                        filter.tenantId = tenantId;
                        args[0] = await MongoSanitizer.sanitizeQuery(filter);
                    } else if (prop === 'aggregate') {
                        let pipeline = (args[0] || []) as any[];
                        if (Array.isArray(pipeline)) {
                            const hasTenantMatch = pipeline.some(stage => stage.$match && stage.$match.tenantId);
                            if (!hasTenantMatch) {
                                pipeline = [{ $match: { tenantId } }, ...pipeline];
                            }
                            args[0] = await MongoSanitizer.sanitizeQuery(pipeline);
                        }
                    } else {
                        const filter = (args[0] || {}) as Record<string, any>;
                        if (filter && typeof filter === 'object') {
                            filter.tenantId = tenantId;
                            args[0] = await MongoSanitizer.sanitizeQuery(filter);
                        }
                    }
                    return original.apply(target, args);
                };
            }

            if (prop === distinctMethod) {
                return async (...args: unknown[]) => {
                    const filter = (args[1] || {}) as Record<string, any>;
                    filter.tenantId = session.user.tenantId;
                    args[1] = await MongoSanitizer.sanitizeQuery(filter);
                    return original.apply(target, args);
                };
            }

            return original.bind(target);
        }
    }) as any;
}
