import { TranslationService } from '../src/lib/translation-service';
import { getTenantCollection } from '../src/lib/db-tenant';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verify() {
    console.log('\n--- 🧪 Verificando Leakage de Tenant para SuperAdmin ---');

    // Simular contexto de SuperAdmin
    const session = { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } };
    const collection = await getTenantCollection('i18n_translations', session);

    const locale = 'es';
    const docs = await collection.find({ locale });

    console.log(`Total documentos encontrados para '${locale}': ${docs.length}`);

    const tenants = new Set(docs.map(d => d.tenantId));
    console.log('Tenants presentes en los resultados:', Array.from(tenants));

    if (tenants.size > 1) {
        console.log('❌ CONFIRMADO: El SuperAdmin ve documentos de MÚLTIPLES tenants sin filtro explícito.');
    } else {
        console.log('✅ El SuperAdmin solo ve un tenant (o solo hay uno en DB).');
    }

    process.exit(0);
}

verify();
