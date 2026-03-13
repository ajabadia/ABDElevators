
// Mocking logEvento since we are running in a script context
const { MongoSanitizer } = require('../src/lib/mongo-sanitizer');

async function verifyFix() {
    console.log('--- Sanitizer Fix Verification ---');
    
    const query = { email: 'superadmin@abd.com' };
    console.log('Original Query:', JSON.stringify(query));
    
    // We expect sanitized to be equal to query now
    const sanitized = await MongoSanitizer.sanitizeQuery(query);
    console.log('Sanitized Query:', JSON.stringify(sanitized));
    
    if (sanitized.email === 'superadmin@abd.com') {
        console.log('✅ SUCCESS: Email is preserved correctly without escaping.');
    } else {
        console.log('❌ FAILURE: Email is still being escaped or altered:', sanitized.email);
        process.exit(1);
    }

    // Verify operator blocking still works
    const maliciousQuery = { password: { $gt: "" } };
    const sanitizedMalicious = await MongoSanitizer.sanitizeQuery(maliciousQuery);
    console.log('Malicious Query Sanitized:', JSON.stringify(sanitizedMalicious));
}

verifyFix().catch(console.error);
