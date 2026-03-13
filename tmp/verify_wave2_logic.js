
// Self-contained logic verification for Wave 2 Sanitization & Masking

// 1. PII MASKING LOGIC (from src/lib/sanitization.ts)
const SENSITIVE_FIELDS = ['taxId', 'phone', 'telefono', 'password', 'secret', 'iban', 'dni', 'billingEmail'];

function maskSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(item => maskSensitiveData(item));
    }

    const masked = {};
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
            if (typeof value === 'string' && value.length > 4) {
               masked[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
            } else {
               masked[key] = '***';
            }
        } else if (typeof value === 'object' && value !== null) {
            masked[key] = maskSensitiveData(value);
        } else {
            masked[key] = value;
        }
    }
    return masked;
}

// 2. NOSQL SANITIZATION LOGIC (from src/lib/mongo-sanitizer.ts)
class MongoSanitizer {
    static async sanitizeQuery(input) {
        if (!input || typeof input !== 'object') return input;
        const sanitized = Array.isArray(input) ? [] : {};
        
        for (const [key, value] of Object.entries(input)) {
            // Rule: No keys starting with $ (except allowed operators)
            if (key.startsWith('$') && !['$eq', '$in', '$nin', '$exists', '$ne'].includes(key)) {
                console.log(`[SECURITY] Suspicious operator removed: ${key}`);
                continue;
            }
            
            // Rule: No dot notation in keys if not specifically allowed
            if (key.includes('.')) {
                console.log(`[SECURITY] Suspicious dot-notation removed: ${key}`);
                continue;
            }

            if (typeof value === 'object' && value !== null) {
                sanitized[key] = await this.sanitizeQuery(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

// TEST SUITE
async function runTests() {
    console.log('--- STARTING SECURITY WAVE 2 AUDIT ---');

    // Test 1: PII Masking
    const rawData = {
        email: 'test@example.com',
        taxId: 'B12345678',
        billingEmail: 'billing@example.com',
        secret: 'password123',
        safe: 'Keep me'
    };
    const masked = maskSensitiveData(rawData);
    console.log('\nPII Masking Result:', JSON.stringify(masked, null, 2));
    if (masked.taxId.includes('***') && masked.billingEmail.includes('***') && masked.safe === 'Keep me') {
        console.log('✅ PII Masking Passed');
    } else {
        console.log('❌ PII Masking Failed');
    }

    // Test 2: NoSQL Injection
    const evilQuery = {
        tenantId: '123',
        $where: 'sleep(5000)',
        'admin.password': { $ne: null },
        normal: { $eq: 'value' }
    };
    const sanitized = await MongoSanitizer.sanitizeQuery(evilQuery);
    console.log('\nNoSQL Sanitization Result:', JSON.stringify(sanitized, null, 2));
    if (!sanitized.$where && !sanitized['admin.password'] && sanitized.normal.$eq === 'value') {
        console.log('✅ NoSQL Sanitization Passed');
    } else {
        console.log('❌ NoSQL Sanitization Failed');
    }

    console.log('\n--- AUDIT COMPLETE ---');
}

runTests();
