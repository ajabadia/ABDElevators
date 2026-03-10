
const { ObjectId } = require('mongodb');
const ids = ['invalid-id', '65e9c6e5a6c3a123bc000001', '', undefined, null];

console.log('Testing ObjectId robust conversion:');
ids.forEach(id => {
    try {
        if (!id) {
            console.log(`[PASS] Skipping empty/null id: ${id}`);
            return;
        }
        if (typeof id !== 'string' || id.length !== 24) {
            throw new Error('Not a 24-char hex string');
        }
        const objId = new ObjectId(id);
        console.log(`[SUCCESS] Valid ObjectId: ${objId}`);
    } catch (e) {
        console.log(`[FAIL] Invalid ID detected: "${id}". Error: ${e.message}`);
    }
});
