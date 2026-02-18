import { IndustryTypeSchema } from './packages/platform-core/src/index';
console.log('✅ IndustryTypeSchema resolved:', IndustryTypeSchema !== undefined);

try {
    const { connectDB } = require('./packages/platform-core/src/server');
    console.log('✅ Server module resolved (CommonJS)');
} catch (e) {
    console.log('❌ Server module resolution failed (expected if ESM only)');
}
