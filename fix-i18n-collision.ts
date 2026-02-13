import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function fixCollision() {
    console.log('🧹 Limpiando colisiones de i18n...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // Borrar las dos llaves que causan el conflicto
        const result = await collection.deleteMany({
            key: 'common.spaces'
        });

        console.log(`✅ Se eliminaron ${result.deletedCount} llaves que causaban colisión (common.spaces string).`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixCollision();
