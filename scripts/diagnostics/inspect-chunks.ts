
import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectChunks() {
    console.log('🔍 Starting Chunk Field Inspection (Saving to JSON)...');
    const results: any = {
        stats: [],
        fieldChecks: []
    };

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // 1. Detailed stats with field presence
        console.log('\n📊 Aggregating field presence...');
        const stats = await collection.aggregate([
            {
                $group: {
                    _id: { industry: "$industry", env: "$environment", tenantId: "$tenantId" },
                    total: { $sum: 1 },
                    hasEmbedding: { $sum: { $cond: [{ $ifNull: ["$embedding", false] }, 1, 0] } },
                    hasMultilingual: { $sum: { $cond: [{ $ifNull: ["$embedding_multilingual", false] }, 1, 0] } },
                    hasChunkText: { $sum: { $cond: [{ $ifNull: ["$chunkText", false] }, 1, 0] } }
                }
            }
        ]).toArray();
        results.stats = stats;

        // 2. Check a few specific chunks that might be problematic
        const problematic = await collection.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding_multilingual: { $exists: false } }
            ]
        }).limit(5).toArray();

        results.fieldChecks = problematic.map(p => ({
            id: p._id,
            source: p.sourceDoc,
            missing: {
                embedding: !p.embedding,
                embedding_multilingual: !p.embedding_multilingual
            }
        }));

        fs.writeFileSync('chunk-field-inspection.json', JSON.stringify(results, null, 2));
        console.log('✅ Results saved to chunk-field-inspection.json');

        // Summary to console
        stats.forEach(s => {
            console.log(`- ${s._id.industry}/${s._id.env} (${s._id.tenantId}): ${s.total} total`);
            console.log(`  Embeddings: ${s.hasEmbedding}/${s.total}`);
            console.log(`  Multilingual: ${s.hasMultilingual}/${s.total}`);
        });

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }

    process.exit(0);
}

inspectChunks();
