import { getTenantCollection } from './src/lib/db-tenant';

async function checkDb() {
    console.log('🔍 Checking translations in DB...');
    const collection = await getTenantCollection('translations', { user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' } } as any);

    const esDocs = await collection.find({
        key: { $regex: /^admin\.guardian/ },
        locale: 'es',
        tenantId: 'platform_master'
    });

    const enDocs = await collection.find({
        key: { $regex: /^admin\.guardian/ },
        locale: 'en',
        tenantId: 'platform_master'
    });

    console.log(`🇪🇸 ES Docs for admin.guardian: ${esDocs.length}`);
    esDocs.forEach(d => console.log(`  - ${d.key}: ${d.value}`));

    console.log(`🇬🇧 EN Docs for admin.guardian: ${enDocs.length}`);
    enDocs.forEach(d => console.log(`  - ${d.key}: ${d.value}`));

    process.exit(0);
}

checkDb().catch(err => {
    console.error('❌ Error checking DB:', err);
    process.exit(1);
});
