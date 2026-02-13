import { connectDB } from './src/lib/db';
import { getTenantCollection } from './src/lib/db-tenant';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verify() {
    console.log('🔍 Listando todas las keys en BD...');
    try {
        await connectDB();
        const collection = await getTenantCollection('translations', { user: { tenantId: 'platform_master' } });

        const allKeys = await collection.find({ locale: 'es', isObsolete: false });
        console.log(`📊 Total keys activas en 'es': ${allKeys.length}`);

        const namespaces = new Set(allKeys.map(t => t.key.split('.')[0]));
        console.log(`📦 Namespaces encontrados:`, Array.from(namespaces));

        console.log('📝 Muestra de 20 keys:');
        console.log(allKeys.slice(0, 20).map(t => t.key));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
