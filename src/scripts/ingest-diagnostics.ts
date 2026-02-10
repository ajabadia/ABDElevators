import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { getTenantCollection } from '../lib/db-tenant';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseIngestion() {
    console.log('🔍 INGESTION DIAGNOSTICS START');

    try {
        const db = await connectDB();
        console.log(`Connected to DB: ${db.databaseName}`);

        const session = { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } };

        // 1. Check latest Knowledge Assets
        const assetsColl = await getTenantCollection('knowledge_assets', session);
        const latestAssets = await assetsColl.find({}, { sort: { createdAt: -1 } as any, limit: 5 });

        console.log('\n--- LATEST KNOWLEDGE ASSETS ---');
        latestAssets.forEach((a: any) => {
            console.log(`ID: ${a._id}`);
            console.log(`Filename: ${a.filename}`);
            console.log(`Status: ${a.ingestionStatus}`);
            console.log(`Error: ${a.error || 'none'}`);
            console.log(`CorrelationId: ${a.correlationId || 'N/A'}`);
            console.log(`Cloudinary URL: ${a.cloudinaryUrl || 'MISSING'}`);
            console.log('---------------------------');
        });

        // 2. Check latest Ingestion Audits
        const auditColl = await getTenantCollection('audit_ingestion', session);
        const latestAudits = await auditColl.find({}, { sort: { timestamp: -1 } as any, limit: 5 });

        console.log('\n--- LATEST INGESTION AUDITS ---');
        latestAudits.forEach((aud: any) => {
            console.log(`ID: ${aud._id}`);
            console.log(`Status: ${aud.status}`);
            console.log(`CorrelationId: ${aud.correlationId}`);
            console.log(`Filename: ${aud.filename}`);
            console.log(`Timestamp: ${aud.timestamp}`);
            console.log('---------------------------');
        });

        // 3. Check latest Logs for Errors
        const logsColl = await getTenantCollection('logs', session);
        const latestErrors = await logsColl.find({ level: 'ERROR' }, { sort: { timestamp: -1 } as any, limit: 5 });

        console.log('\n--- LATEST ERROR LOGS ---');
        latestErrors.forEach((l: any) => {
            console.log(`Time: ${l.timestamp}`);
            console.log(`Action: ${l.action}`);
            console.log(`Message: ${l.message}`);
            console.log(`Source: ${l.source}`);
            console.log(`CorrelationId: ${l.correlationId}`);
            if (l.details) console.log(`Details: ${JSON.stringify(l.details)}`);
            console.log('---------------------------');
        });

    } catch (e: any) {
        console.error('❌ DIAGNOSTICS FAILED', e);
    } finally {
        process.exit(0);
    }
}

diagnoseIngestion();
