
import { MongoSanitizer } from './src/lib/mongo-sanitizer';

async function testProxyFinal() {
    console.log('--- Final Proxy Verification (SecureCollection context) ---');
    
    // Simulations SecureCollection: methods ALREADY return Promises
    const mockSecureCollection = {
        find: async (filter: any) => {
            console.log('Core find called with:', filter);
            return [{ id: 1 }]; // Array, not Cursor
        },
        aggregate: async (pipeline: any) => {
            console.log('Core aggregate called with:', pipeline);
            return [{ id: 1 }]; // Array, not Cursor
        }
    };

    const handler = {
        get: (target: any, prop: string | symbol) => {
            const original = (target as any)[prop];
            if (typeof original !== 'function') return original;

            const asyncFilterMethods = ['find', 'aggregate'];

            if (asyncFilterMethods.includes(prop as string)) {
                return async (...args: any[]) => {
                    console.log(`Proxy: Intercepting async ${String(prop)}`);
                    args[0] = { ...args[0], tenantId: 'test-tenant' };
                    // Even if we wrap it in another async, awaiting it should resolve the internal promise
                    return original.apply(target, args);
                };
            }

            return original.bind(target);
        }
    };

    const proxied = new Proxy(mockSecureCollection, handler);

    console.log('\n1. Testing proxied.find() - Result should be Array');
    try {
        const result = await proxied.find({ x: 1 });
        console.log('Result:', result);
        console.log('Is Array?', Array.isArray(result));
    } catch (e) {
        console.error('FAILED find() test:', e);
    }

    console.log('\n2. Testing proxied.aggregate() - Result should be Array');
    try {
        const result = await proxied.aggregate([]);
        console.log('Result:', result);
        console.log('Is Array?', Array.isArray(result));
    } catch (e) {
        console.error('FAILED aggregate() test:', e);
    }
}

testProxyFinal();
