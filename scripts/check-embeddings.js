const { MongoClient } = require('mongodb');

async function checkEmbeddingModel() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log("--- SEARCHING FOR CHUNKS WITH EMBEDDINGS ---");
        const chunks = await db.collection('document_chunks').find({
            embedding: { $exists: true, $ne: null }
        }).limit(10).toArray();

        if (chunks.length > 0) {
            chunks.forEach((chunk, i) => {
                const dims = Array.isArray(chunk.embedding) ? chunk.embedding.length : 'NOT_ARRAY';
                console.log(`Chunk ${i + 1}: Source=${chunk.sourceDoc}, Model=${chunk.model}, Dims=${dims}`);
            });
        } else {
            console.log("No chunks found with embeddings.");

            // Just check one document without filter to see structure
            const anyChild = await db.collection('document_chunks').findOne({});
            console.log("\n--- STRUCTURE OF ANY CHUNK ---");
            console.log(JSON.stringify(Object.keys(anyChild || {}), null, 2));
        }

    } finally {
        await client.close();
    }
}

checkEmbeddingModel();
