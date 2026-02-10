import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixBlobs() {
    console.log('🔧 Fixing File Blobs Visibility...');

    try {
        const db = await connectDB();
        const collection = db.collection('file_blobs'); // Access raw collection

        const result = await collection.updateMany(
            { tenantId: { $exists: false } },
            { $set: { tenantId: 'abd_global' } }
        );

        console.log(`✅ Fixed ${result.modifiedCount} blobs (added tenantId='abd_global').`);
        console.log(`ℹ️ Matched ${result.matchedCount} blobs.`);

    } catch (error: any) {
        console.error('❌ Error fixing blobs:', error);
    } finally {
        process.exit(0);
    }
}

fixBlobs();
