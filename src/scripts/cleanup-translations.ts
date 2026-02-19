import { getTenantCollection } from './lib/db-tenant';

async function cleanupTranslations() {
    console.log('🚀 Starting translation cleanup...');

    // Using a mock session for system operations
    const session = { user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' } } as any;
    const collection = await getTenantCollection('translations', session);

    // Identify the conflicting keys
    // In this case, 'actions' as a flat string is conflicting with 'actions.label', 'actions.save', etc.
    const locales = ['es', 'en'];

    for (const locale of locales) {
        console.log(`Checking locale: ${locale}`);

        // Find if 'actions' exists as a flat key
        const flatAction = await collection.findOne({ key: 'actions', locale, tenantId: 'platform_master' });

        if (flatAction) {
            console.log(`Found flat 'actions' key for ${locale}: "${flatAction.value}". Marking as obsolete.`);
            // Instead of deleting, we mark as obsolete as per project patterns
            await collection.updateOne(
                { _id: flatAction._id },
                { $set: { isObsolete: true, lastUpdated: new Date() } }
            );
        } else {
            console.log(`No flat 'actions' key found for ${locale}.`);
        }
    }

    console.log('✅ Cleanup finished.');
    process.exit(0);
}

cleanupTranslations().catch(err => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
});
