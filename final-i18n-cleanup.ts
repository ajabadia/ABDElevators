import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function finalCleanup() {
    console.log('🧹 Eliminando llaves de colisión de TODOS los tenants...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const keysToDelete = ['common.spaces', 'common.search', 'common.enterpriseSecurity'];

        const result = await collection.deleteMany({
            key: { $in: keysToDelete }
        });

        console.log(`✅ Se eliminaron ${result.deletedCount} registros de colisión en total.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

finalCleanup();
