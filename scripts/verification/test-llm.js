const { callGeminiMini } = require('./src/lib/llm');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log('--- Testing callGeminiMini ---');
        const response = await callGeminiMini('Responde "HOLA" si puedes leer esto.', 'abd_global', { correlationId: 'test-id' });
        console.log('Response:', response);
    } catch (error) {
        console.error('FAILED:', error);
    }
}

run();
