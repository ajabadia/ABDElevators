
import { getTenantCollection } from './src/lib/db-tenant';
import { connectDB } from './src/lib/db';

async function testProxy() {
    console.log('--- Testing Proxy Sync Behavior ---');
    const mockSession = { user: { tenantId: 'test-tenant' } };
    
    // We need a real-ish collection or a very good mock.
    // For this test, let's just use the Proxy logic if we can mock the target.
    
    const mockCollection = {
        find: (filter: any) => {
            console.log('Original find called with:', filter);
            return { toArray: async () => [{ id: 1 }] };
        },
        aggregate: (pipeline: any) => {
            console.log('Original aggregate called with:', pipeline);
            return { toArray: async () => [{ id: 1 }] };
        },
        findOne: async (filter: any) => {
            console.log('Original findOne called with:', filter);
            return { id: 1 };
        }
    };

    const handler = {
        get: (target: any, prop: string | symbol) => {
            const original = (target as any)[prop];
            if (typeof original !== 'function') return original;

            const asyncFilterMethods = ['findOne'];
            const cursorMethods = ['find', 'aggregate'];

            if (asyncFilterMethods.includes(prop as string)) {
                return async (...args: any[]) => {
                    console.log(`Proxy: Intercepting async ${String(prop)}`);
                    args[0] = { ...args[0], tenantId: 'test-tenant' };
                    return original.apply(target, args);
                };
            }

            if (cursorMethods.includes(prop as string)) {
                return (...args: any[]) => {
                    console.log(`Proxy: Intercepting cursor ${String(prop)}`);
                    if (prop === 'find') args[0] = { ...args[0], tenantId: 'test-tenant' };
                    if (prop === 'aggregate') args[0] = [{ $match: { tenantId: 'test-tenant' } }, ...args[0]];
                    return original.apply(target, args);
                };
            }

            return original.apply(target, args);
        }
    };

    const proxied = new Proxy(mockCollection, handler);

    console.log('\n1. Testing find().toArray() - Should NOT throw');
    try {
        const result = await proxied.find({ x: 1 }).toArray();
        console.log('Result:', result);
    } catch (e) {
        console.error('FAILED find() test:', e);
    }

    console.log('\n2. Testing aggregate().toArray() - Should NOT throw');
    try {
        const result = await proxied.aggregate([]).toArray();
        console.log('Result:', result);
    } catch (e) {
        console.error('FAILED aggregate() test:', e);
    }

    console.log('\n3. Testing findOne() - Should be Promise');
    try {
        const promise = proxied.findOne({ x: 1 });
        console.log('findOne returned type:', typeof promise);
        const result = await promise;
        console.log('Result:', result);
    } catch (e) {
        console.error('FAILED findOne() test:', e);
    }
}

testProxy();
