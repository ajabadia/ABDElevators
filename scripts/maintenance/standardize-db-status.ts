import { MongoClient } from 'mongodb';

async function standardizeStatus() {
    console.log('[MIGRATION] Standardizing status values to English...');
    const mainUri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const client = new MongoClient(mainUri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        // 1. Knowledge Assets
        const assetResult = await db.collection('knowledge_assets').updateMany(
            { status: 'vigente' },
            { $set: { status: 'ACTIVE' } }
        );
        console.log(`[ASSETS] Migrated 'vigente' -> 'ACTIVE': ${assetResult.modifiedCount}`);

        const assetResultObs = await db.collection('knowledge_assets').updateMany(
            { status: 'obsoleto' },
            { $set: { status: 'ARCHIVED' } }
        );
        console.log(`[ASSETS] Migrated 'obsoleto' -> 'ARCHIVED': ${assetResultObs.modifiedCount}`);

        const assetResultDraft = await db.collection('knowledge_assets').updateMany(
            { status: 'borrador' },
            { $set: { status: 'DRAFT' } }
        );
        console.log(`[ASSETS] Migrated 'borrador' -> 'DRAFT': ${assetResultDraft.modifiedCount}`);

        // Handle inconsistent status found in audit (e.g. 'indexed')
        const assetResultIndexed = await db.collection('knowledge_assets').updateMany(
            { status: 'indexed' },
            { $set: { status: 'ACTIVE' } }
        );
        console.log(`[ASSETS] Migrated 'indexed' -> 'ACTIVE': ${assetResultIndexed.modifiedCount}`);

        // 2. Document Chunks
        const chunkResult = await db.collection('document_chunks').updateMany(
            { status: 'vigente' },
            { $set: { status: 'ACTIVE' } }
        );
        console.log(`[CHUNKS] Migrated 'vigente' -> 'ACTIVE': ${chunkResult.modifiedCount}`);

        const chunkResultObs = await db.collection('document_chunks').updateMany(
            { status: 'obsoleto' },
            { $set: { status: 'ARCHIVED' } }
        );
        console.log(`[CHUNKS] Migrated 'obsoleto' -> 'ARCHIVED': ${chunkResultObs.modifiedCount}`);

        const chunkResultIndexed = await db.collection('document_chunks').updateMany(
            { status: 'indexed' },
            { $set: { status: 'ACTIVE' } }
        );
        console.log(`[CHUNKS] Migrated 'indexed' -> 'ACTIVE': ${chunkResultIndexed.modifiedCount}`);

        const chunkResultMissing = await db.collection('document_chunks').updateMany(
            { status: { $exists: false } },
            { $set: { status: 'ACTIVE' } }
        );
        console.log(`[CHUNKS] Set missing status -> 'ACTIVE': ${chunkResultMissing.modifiedCount}`);

    } catch (error) {
        console.error('[MIGRATION ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

standardizeStatus();
