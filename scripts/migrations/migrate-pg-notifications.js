
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script NO debe ejecutarse en producción. Abortando.');
    process.exit(1);
}

async function migrate() {
    const mainClient = new MongoClient(process.env.MONGODB_URI);
    const authClient = new MongoClient(process.env.MONGODB_AUTH_URI);
    const logsClient = new MongoClient(process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI);

    try {
        await mainClient.connect();
        await authClient.connect();
        await logsClient.connect();

        const mainDb = mainClient.db('ABDElevators');
        const authDb = authClient.db('ABDElevators-Auth');
        const logsDb = logsClient.db(process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators');

        console.log('--- Phase 87.5: Centralization Migration ---');

        // 1. Migrate permission_groups (MAIN -> AUTH)
        const groups = await mainDb.collection('permission_groups').find().toArray();
        console.log(`Permission Groups to migrate: ${groups.length}`);
        if (groups.length > 0) {
            await authDb.collection('permission_groups').deleteMany({}); // Clear target for idempotency
            await authDb.collection('permission_groups').insertMany(groups);
            console.log('Successfully migrated permission_groups to AUTH.');
            await mainDb.collection('permission_groups').rename(`permission_groups_migrated_${Date.now()}`);
        }

        // 2. Migrate notifications (MAIN -> LOGS)
        const notifications = await mainDb.collection('notifications').find().toArray();
        console.log(`Notifications to migrate: ${notifications.length}`);
        if (notifications.length > 0) {
            await logsDb.collection('notifications').deleteMany({});
            await logsDb.collection('notifications').insertMany(notifications);
            console.log('Successfully migrated notifications to LOGS.');
            await mainDb.collection('notifications').rename(`notifications_migrated_${Date.now()}`);
        }

        // 3. Migrate notification_templates (MAIN -> LOGS)
        const templates = await mainDb.collection('notification_templates').find().toArray();
        console.log(`Templates to migrate: ${templates.length}`);
        if (templates.length > 0) {
            await logsDb.collection('notification_templates').deleteMany({});
            await logsDb.collection('notification_templates').insertMany(templates);
            console.log('Successfully migrated notification_templates to LOGS.');
            await mainDb.collection('notification_templates').rename(`notification_templates_migrated_${Date.now()}`);
        }

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await mainClient.close();
        await authClient.close();
        await logsClient.close();
    }
}

migrate();
