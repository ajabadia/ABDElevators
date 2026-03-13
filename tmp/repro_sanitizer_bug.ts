
const { MongoSanitizer } = require('../src/lib/mongo-sanitizer');

async function testObjects() {
    console.log('--- Sanitizer Object Preservation Test ---');
    
    const now = new Date();
    const regex = /test/i;
    
    const query = {
        deletedAt: { $exists: false },
        timestamp: { $gte: now },
        action: { $regex: regex }
    };
    
    console.log('Original Query types:');
    console.log('timestamp is Date:', query.timestamp.$gte instanceof Date);
    console.log('action is RegExp:', query.action.$regex instanceof RegExp);

    const sanitized = await MongoSanitizer.sanitizeQuery(query);
    
    console.log('\nSanitized Query:');
    console.log(JSON.stringify(sanitized, null, 2));
    
    console.log('\nSanitized results types:');
    console.log('timestamp is Date:', sanitized.timestamp.$gte instanceof Date);
    console.log('action is RegExp:', sanitized.action.$regex instanceof RegExp);
    
    if (sanitized.timestamp.$gte instanceof Date && sanitized.action.$regex instanceof RegExp) {
        console.log('\n✅ SUCCESS: Objects are preserved.');
    } else {
        console.log('\n❌ FAILURE: Objects were converted or destroyed.');
    }
}

testObjects().catch(console.error);
