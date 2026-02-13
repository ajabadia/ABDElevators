import { connectDB } from './src/lib/db';
import { getTenantCollection } from './src/lib/db-tenant';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verify() {
    console.log('🔍 Verificando base de datos...');
    try {
        await connectDB();
        const collection = await getTenantCollection('translations', { user: { tenantId: 'platform_master' } });

        const allKeys = await collection.find({ locale: 'es' });
        console.log(`📊 Total keys en 'es': ${allKeys.length}`);

        const spacesKeys = allKeys.filter(t => t.key.includes('spaces'));
        console.log(`🔍 Keys con 'spaces': ${spacesKeys.length}`);
        if (spacesKeys.length > 0) {
            console.log('📝 Ejemplo:', spacesKeys.slice(0, 5).map(t => `${t.key}: ${t.value}`));
        } else {
            console.log('❌ No se encontraron keys con \'spaces\'');
            console.log('📝 Muestra de 10 keys:');
            console.log(allKeys.slice(0, 10).map(t => t.key));
        }

        const enterpriseKeys = allKeys.filter(t => t.key.includes('Security'));
        console.log(`🔍 Keys con 'Security': ${enterpriseKeys.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
