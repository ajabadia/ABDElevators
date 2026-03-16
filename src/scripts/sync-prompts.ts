import { PromptService } from '@/services/llm/prompt-service';
import { connectDB } from '@/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('🚀 Starting Prompt Sync (Rule #12)...');
    
    try {
        // Ensure DB connection
        await connectDB();
        
        const tenantId = 'abd_global'; // System tenant
        console.log(`📡 Syncing fallbacks for tenant: ${tenantId}...`);
        
        const result = await PromptService.syncFallbacks(tenantId);
        
        console.log('✅ Sync Complete!');
        console.log(`📊 Stats:
- Created: ${result.created}
- Updated: ${result.updated}
- Errors:  ${result.errors}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Sync Failed:', error);
        process.exit(1);
    }
}

main();
