
import { AI_MODEL_IDS, DEFAULT_MODEL } from './lib/constants/ai-models';

async function main() {
    console.log('--- AI MODEL CONSTANTS ---');
    console.log('AI_MODEL_IDS:', JSON.stringify(AI_MODEL_IDS, null, 2));
    console.log('DEFAULT_MODEL:', DEFAULT_MODEL);
    process.exit(0);
}

main();
