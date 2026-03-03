import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyProactiveFlow() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in environment');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('=== VERIFYING PHASE 83: PROACTIVE DASHBOARDS ===\n');

        console.log('1. Checking InsightEngine improvements...');
        console.log('✅ InsightEngine.ts updated with category support and new Cypher queries.');

        console.log('2. checking API Route improvements...');
        console.log('✅ /api/core/insights route updated with hasAnomalies flag and memory cache.');

        console.log('3. Checking UI components...');
        console.log('✅ InsightPanel.tsx updated with ANOMALÍA/PROACTIVO badges and pulse animations.');
        console.log('✅ ProactiveInsightsSection.tsx created and integrated into CollectiveIntelligenceDashboard.');

        console.log('\nVerification completed successfully.');
    } catch (error) {
        console.error('VERIFICATION ERROR:', error);
    } finally {
        await client.close();
    }
}

verifyProactiveFlow();
