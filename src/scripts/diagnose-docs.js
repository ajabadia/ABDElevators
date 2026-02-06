
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(); // Uses db name from URI

        const collections = [
            'documentos',
            'documentos_usuarios',
            'documentos_tecnicos',
            'user_documents',
            'knowledge_assets'
        ];

        console.log('--- Document Count Diagnostic ---');
        for (const colName of collections) {
            try {
                const count = await db.collection(colName).countDocuments();
                console.log(`${colName}: ${count} docs`);

                if (count > 0) {
                    const sample = await db.collection(colName).findOne();
                    console.log(`  Sample keys: ${Object.keys(sample).join(', ')}`);
                    if (sample.userId) console.log(`  Sample userId: ${sample.userId}`);
                    if (sample.tenantId) console.log(`  Sample tenantId: ${sample.tenantId}`);
                }
            } catch (e) {
                console.log(`${colName}: [Error or Not Found]`);
            }
        }
    } finally {
        await client.close();
    }
}

diagnose();
