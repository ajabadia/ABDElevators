
import { ObservabilityRepository } from './services/observability/ObservabilityRepository';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('--- FETCHING ERROR LOGS ---');
    try {
        const logs = await ObservabilityRepository.getLogs({ limit: 100 });
        const errors = logs.filter(l => l.level === 'ERROR' || l.source.includes('INGEST') || l.action.includes('INGEST'));
        
        console.log(`Found ${errors.length} relevant logs in the last 100.`);
        errors.reverse().forEach(log => {
            const time = new Date(log.timestamp).toISOString();
            console.log(`[${time}] [${log.level}] [${log.source}] [${log.action}]`);
            console.log(`   Message: ${log.message}`);
            if (log.details) {
                console.log('   Details:', JSON.stringify(log.details, null, 2));
            }
            if (log.stack) {
                console.log('   Stack:', log.stack);
            }
            console.log('-----------------------------------');
        });
        process.exit(0);
    } catch (e: any) {
        console.error('Failed to read logs!');
        console.error(e);
        process.exit(1);
    }
}

main();
