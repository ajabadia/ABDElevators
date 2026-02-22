const { MongoClient } = require('mongodb');

async function checkAllChunks() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const chunks = await db.collection('document_chunks').find({}).toArray();
        console.log(`Analyzing ${chunks.length} chunks...`);

        chunks.forEach((c, i) => {
            const hasEmbedding = !!c.embedding;
            const dims = hasEmbedding && Array.isArray(c.embedding) ? c.embedding.length : 0;
            console.log(`[${i}] ID: ${c._id}, Source: ${c.sourceDoc}, Industry: ${c.industry}, Dims: ${dims}, Keys: ${Object.keys(c).join(',')}`);
        });

    } finally {
        await client.close();
    }
}

checkAllChunks();
