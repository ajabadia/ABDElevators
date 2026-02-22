const { MongoClient } = require('mongodb');

async function run() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const coll = db.collection('document_chunks');

        const docs = await coll.find().toArray();
        console.log(`TOTAL_DOCS: ${docs.length}`);

        for (let i = 0; i < docs.length; i++) {
            const d = docs[i];
            const keys = Object.keys(d);
            const hasEmb = keys.includes('embedding');
            const type = hasEmb ? typeof d.embedding : 'N/A';
            const len = (hasEmb && Array.isArray(d.embedding)) ? d.embedding.length : 'N/A';
            console.log(`DOC ${i}: id=${d._id}, has_embedding=${hasEmb}, type=${type}, dimension=${len}`);
        }

    } finally {
        await client.close();
    }
}

run();
