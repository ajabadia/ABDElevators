import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from './src/lib/db';

async function findSpecificKey() {
    console.log('🔍 Buscando llaves específicas en EN...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        const keys = [
            'common.spaces.admin.manage',
            'common.spaces.title',
            'spaces.admin.manage'
        ];

        for (const key of keys) {
            const docs = await collection.find({ key, locale: 'en' }).toArray();
            console.log(`🔑 Key: ${key} -> Found ${docs.length} docs`);
            for (const d of docs) {
                console.log(`   - Locale: ${d.locale}, Tenant: ${d.tenantId}, Obsolete: ${d.isObsolete}, Value: "${d.value}"`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findSpecificKey();
