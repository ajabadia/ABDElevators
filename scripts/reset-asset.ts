import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function resetAssetStatus() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        const result = await collection.updateOne(
            { filename: /Real Decreto/ },
            {
                $set: {
                    ingestionStatus: 'PENDING',
                    error: null,
                    attempts: 0,
                    progress: 0,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount > 0) {
            console.log('✅ Asset status reset to PENDING');
        } else {
            console.log('❌ Asset not found');
        }

    } catch (e) {
        console.error('Error resetting asset:', e);
    } finally {
        process.exit(0);
    }
}

resetAssetStatus();
