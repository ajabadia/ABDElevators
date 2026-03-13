
const { MongoSanitizer } = require('../src/lib/mongo-sanitizer');

async function benchmark() {
    console.log('--- MongoSanitizer Benchmark ---');
    
    const iterations = 10000;
    const complexQuery = {
        email: 'superadmin@abd.com',
        nested: {
            a: 1,
            b: [1, 2, { c: 3, d: new Date() }],
            e: /test/i
        },
        filters: {
            $or: [
                { status: 'ACTIVE' },
                { deletedAt: { $exists: false } }
            ]
        }
    };
    
    console.time('Sanitize Complex Query (10k iterations)');
    for (let i = 0; i < iterations; i++) {
        await MongoSanitizer.sanitizeQuery(complexQuery);
    }
    console.timeEnd('Sanitize Complex Query (10k iterations)');
    
    const simpleQuery = { email: 'test@example.com' };
    console.time('Sanitize Simple Query (10k iterations)');
    for (let i = 0; i < iterations; i++) {
        await MongoSanitizer.sanitizeQuery(simpleQuery);
    }
    console.timeEnd('Sanitize Simple Query (10k iterations)');
}

benchmark().catch(console.error);
