
import { maskSensitiveData } from './src/lib/sanitization';
import { MongoSanitizer } from './src/lib/mongo-sanitizer';

// 1. PII Masking Verification
const rawData = {
    email: 'test@example.com',
    taxId: 'B12345678',
    phone: '600112233',
    billingEmail: 'billing@example.com',
    secret: 'super-secret-key-12345',
    metadata: {
        nestedSecret: 'nested-val'
    }
};

const masked = maskSensitiveData(rawData);
console.log('--- PII Masking Result ---');
console.log(JSON.stringify(masked, null, 2));

// 2. NoSQL Sanitization Verification
const evilQuery = {
    tenantId: '123',
    $where: 'sleep(1000)',
    'user.password': { $ne: null },
    $gt: ''
};

const sanitized = MongoSanitizer.sanitizeQuery(evilQuery);
console.log('\n--- NoSQL Sanitization Result ---');
console.log(JSON.stringify(sanitized, null, 2));

// Check if critical operators are removed
if (sanitized.$where || sanitized.$gt || sanitized['user.password']) {
    console.error('❌ SANITIZATION FAILED: Sensitive operators detected');
} else {
    console.log('✅ SANITIZATION SUCCESS: Evil operators removed');
}
