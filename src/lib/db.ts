import { 
    connectDB as coreConnectDB,
    connectAuthDB as coreConnectAuthDB,
    connectConfigDB as coreConnectConfigDB,
    connectLogsDB as coreConnectLogsDB,
    getTenantCollection as coreGetTenantCollection
} from '@abd/platform-core/server';
import { MongoSanitizer } from './mongo-sanitizer';
import { Db, Collection, Document } from 'mongodb';

export * from '@abd/platform-core/server';
export { DbMaintenanceService } from './db-maintenance';

/**
 * 🛡️ [SECURITY] Hardening Wave 4: NoSQL Injection Proxy for direct driver access
 */
function wrapCollection<T extends Document>(collection: Collection<T>): Collection<T> {
    return new Proxy(collection, {
        get(target, prop, receiver) {
            const original = (target as any)[prop];
            if (typeof original !== 'function') return original;

            const filterMethods = ['find', 'findOne', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'replaceOne', 'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate'];

            if (filterMethods.includes(prop as string)) {
                return async (...args: unknown[]) => {
                    const filter = args[0];
                    if (filter && typeof filter === 'object') {
                        args[0] = await MongoSanitizer.sanitizeQuery(filter as Record<string, unknown>);
                    }
                    return original.apply(target, args);
                };
            }
            return original.bind(target);
        }
    }) as any;
}

function wrapDb(db: Db): Db {
    return new Proxy(db, {
        get(target, prop, receiver) {
            const original = (target as any)[prop];
            if (prop === 'collection') {
                return (...args: any[]) => {
                    const collection = original.apply(target, args);
                    return wrapCollection(collection);
                };
            }
            return typeof original === 'function' ? original.bind(target) : original;
        }
    }) as any;
}

// 🛡️ Export secured connection functions
export const connectDB = async (...args: any[]) => wrapDb(await (coreConnectDB as any)(...args));
export const connectAuthDB = async (...args: any[]) => wrapDb(await (coreConnectAuthDB as any)(...args));
export const connectConfigDB = async (...args: any[]) => wrapDb(await (coreConnectConfigDB as any)(...args));
export const connectLogsDB = async (...args: any[]) => wrapDb(await (coreConnectLogsDB as any)(...args));
