import { connectDB } from '../../src/lib/db';
import { getTenantCollection } from '../../src/lib/db-tenant';

async function debugDocVisibility() {
    console.log('[DEBUG] Investigating Document Visibility...');
    const tenantId = 'elevadores_mx';
    
    try {
        await connectDB();
        const session = { user: { tenantId, role: 'ADMIN', id: 'system' } } as any;

        const userDocsCol = await getTenantCollection('user_documents', session);
        const kaCol = await getTenantCollection('knowledge_assets', session);

        const uDocs = await userDocsCol.find({}).toArray();
        const kAssets = await kaCol.find({}).toArray();

        console.log(`[DEBUG] Found ${uDocs.length} user_documents`);
        uDocs.forEach(d => console.log(` - ${d.originalName} (ID: ${d._id}, User: ${d.userId}, Status: ${d.status})`));

        console.log(`[DEBUG] Found ${kAssets.length} knowledge_assets`);
        kAssets.forEach(a => console.log(` - ${a.filename} (ID: ${a._id}, Status: ${a.status}, IngestStatus: ${a.ingestionStatus})`));

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        process.exit(0);
    }
}

debugDocVisibility();
