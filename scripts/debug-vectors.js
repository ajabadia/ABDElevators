const { MongoClient } = require('mongodb');

async function run() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const chunk = await db.collection('document_chunks').findOne({});
        if (chunk) {
            console.log("--- CHUNK FULL KEYS ---");
            console.log(Object.keys(chunk));

            // Look for any field that might be a vector (array of numbers)
            for (const [key, value] of Object.entries(chunk)) {
                if (Array.isArray(value) && value.length > 5 && typeof value[0] === 'number') {
                    console.log(`Potential vector field found: ${key} (length: ${value.length})`);
                }
            }
        }

        const countWithEmbedding = await db.collection('document_chunks').countDocuments({ embedding: { $exists: true } });
        console.log("Chunks with 'embedding' field:", countWithEmbedding);

        const totalChunks = await db.collection('document_chunks').countDocuments({});
        console.log("Total chunks:", totalChunks);

    } finally {
        await client.close();
    }
}

run();
