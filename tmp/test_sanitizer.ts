
import { MongoSanitizer } from './src/lib/mongo-sanitizer';

async function testSanitizer() {
    const query = { email: 'superadmin@abd.com' };
    console.log('Original Query:', JSON.stringify(query));
    
    const sanitized = await MongoSanitizer.sanitizeQuery(query);
    console.log('Sanitized Query:', JSON.stringify(sanitized));
    
    if (sanitized.email === 'superadmin@abd\\.com') {
        console.log('❌ BUG CONFIRMED: Email dot was escaped to \\. in a literal match query.');
    } else {
        console.log('✅ Email seems fine or escaped differently.');
    }
}

testSanitizer();
