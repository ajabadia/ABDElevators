import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectTenant() {
    try {
        const db = await connectDB();
        const tenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
        console.log(`🔍 Inspecting tenant: ${tenantId}`);

        const config = await db.collection('ai_configs').findOne({ tenantId });
        console.log(`⚙️ AI Config:`, JSON.stringify(config, null, 2));

        const promptRewriter = await db.collection('prompts').findOne({ key: 'RAG_QUERY_REWRITER', tenantId });
        console.log(`📝 RAG_QUERY_REWRITER:`, JSON.stringify(promptRewriter, null, 2));

        const promptGrader = await db.collection('prompts').findOne({ key: 'RAG_RELEVANCE_GRADER', tenantId });
        console.log(`📝 RAG_RELEVANCE_GRADER:`, JSON.stringify(promptGrader, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error inspecting tenant:', error);
        process.exit(1);
    }
}

inspectTenant();
