
import { logEvento } from '../src/lib/logger';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testLog() {
    console.log("Testing logEvento...");
    try {
        await logEvento({
            level: 'INFO',
            source: 'TEST_SCRIPT',
            action: 'TEST_LOG',
            message: 'Testing if logs are reaching the DB',
            correlationId: 'test-' + Date.now()
        });
        console.log("Log sent successfully.");
    } catch (e) {
        console.error("Error sending log:", e);
    }
}

testLog();
