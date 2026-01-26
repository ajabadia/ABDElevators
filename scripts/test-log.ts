
import { logEvento } from '../src/lib/logger';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testLog() {
    console.log("Testing logEvento...");
    try {
        await logEvento({
            nivel: 'INFO',
            origen: 'TEST_SCRIPT',
            accion: 'TEST_LOG',
            mensaje: 'Testing if logs are reaching the DB',
            correlacion_id: 'test-' + Date.now()
        });
        console.log("Log sent successfully.");
    } catch (e) {
        console.error("Error sending log:", e);
    }
}

testLog();
