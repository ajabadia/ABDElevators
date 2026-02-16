
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script NO debe ejecutarse en producción. Abortando.');
    process.exit(1);
}

async function unifyLogs() {
    const client = new MongoClient(process.env.MONGODB_LOGS_URI);

    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');

        console.log('--- Phase 87.6: Log Collection Unification ---');

        const legacyLogs = await db.collection('logs_aplicacion').find().toArray();
        console.log(`Legacy logs found: ${legacyLogs.length}`);

        if (legacyLogs.length === 0) {
            console.log('No legacy logs to migrate.');
            return;
        }

        const unifiedLogs = legacyLogs.map(log => {
            return {
                level: log.nivel || 'INFO',
                source: log.origen || 'UNKNOWN',
                action: log.accion || 'UNKNOWN',
                message: log.mensaje || '',
                correlationId: log.id_correlacion || log.correlationId || 'legacy-entry',
                tenantId: log.tenantId || null,
                userId: log.userId || log.usuario_id || null,
                details: log.detalles || log.details || {},
                timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
                isLegacy: true // Added for traceability
            };
        });

        // Insert in chunks to avoid BSON limit issues if large
        const CHUNK_SIZE = 500;
        for (let i = 0; i < unifiedLogs.length; i += CHUNK_SIZE) {
            const chunk = unifiedLogs.slice(i, i + CHUNK_SIZE);
            await db.collection('application_logs').insertMany(chunk);
            console.log(`Successfully migrated chunk ${i / CHUNK_SIZE + 1}`);
        }

        console.log('Successfully unified logs_aplicacion into application_logs.');

        // Backup legacy collection
        await db.collection('logs_aplicacion').rename(`logs_aplicacion_migrated_${Date.now()}`);
        console.log('Legacy collection renamed as backup.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.close();
    }
}

unifyLogs();
