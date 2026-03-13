
import { z } from 'zod';

// Replicating the schema here for simplicity to test the regex
const ObjectIdSchema = z.string()
    .min(10, "ID must be at least 10 characters")
    .max(24, "ID must be at most 24 characters")
    .regex(/^[0-9a-fA-F]{10,24}$|^(platform_master|demo-tenant|abd_global)$/, "Invalid ID format");

const testIds = ['67a6270963ea9234655ee90a', 'platform_master', 'demo-tenant', 'abd_global'];
const failIds = ['short', 'very-long-id-that-exceeds-twenty-four-chars', 'invalid@char'];

console.log('--- SUCCESS CASES ---');
testIds.forEach(id => {
    try {
        ObjectIdSchema.parse(id);
        console.log(`✅ ${id} passed`);
    } catch (e) {
        console.log(`❌ ${id} failed:`, e);
    }
});

console.log('\n--- FAILURE CASES ---');
failIds.forEach(id => {
    try {
        ObjectIdSchema.parse(id);
        console.log(`❌ ${id} unexpectedly passed`);
    } catch (e) {
        console.log(`✅ ${id} correctly failed`);
    }
});
