
import { PromptService } from '../src/lib/prompt-service';
import { AiModelManager } from '../src/lib/services/ai-model-manager';
import { getTenantCollection } from '../src/lib/db-tenant';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function liveDiagnostic() {
    const tenantId = process.env.SINGLE_TENANT_ID || 'platform_master';
    const session: any = { user: { tenantId, role: 'SYSTEM', id: 'diagnostic-user' } };
    const key = 'RAG_QUERY_REWRITER';

    console.log(`🧪 Starting Fixed Live Diagnostic for key: ${key}`);
    console.log(`👤 Tenant: ${tenantId}`);

    try {
        const clusters: any[] = ['MAIN', 'AUTH', 'LOGS'];

        for (const clusterName of clusters) {
            console.log(`\n🔍 Inspecting cluster: ${clusterName}...`);
            try {
                const col = await getTenantCollection('prompts', session, clusterName);
                const prompt = await col.findOne({ key, tenantId });

                if (prompt) {
                    console.log(`✅ Found prompt in ${clusterName}:`);
                    console.log(`   - Model: ${prompt.model}`);
                    console.log(`   - Variables: ${JSON.stringify(prompt.variables)}`);
                    console.log(`   - Template (first 50 chars): ${prompt.template.substring(0, 50)}...`);
                } else {
                    console.log(`❌ No prompt found in ${clusterName} for this key/tenant.`);
                }
            } catch (err: any) {
                console.log(`❌ Error accessing ${clusterName}: ${err.message}`);
            }
        }

        // 2. Resolution check
        console.log(`\n⚙️  Testing PromptService.getRenderedPrompt...`);
        const { model } = await PromptService.getRenderedPrompt(
            key,
            { query: 'test', history: '[]', question: 'test' },
            tenantId,
            'PRODUCTION',
            'GENERIC',
            session
        );
        console.log(`🎯 Resolved model: ${model}`);

    } catch (err: any) {
        console.error(`❌ Diagnostic failed:`, err.message);
    }

    process.exit(0);
}

liveDiagnostic();
