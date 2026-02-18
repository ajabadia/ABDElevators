import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { CausalImpactService } from '../services/causal-impact-service';

/**
 * 🧪 Deep Verification: Causal AI Endpoint
 */
async function verifyEndpoint() {
    const logFile = 'debug_service.log';
    fs.writeFileSync(logFile, '🏁 Starting Deep Verification\n');

    try {
        fs.appendFileSync(logFile, `🔑 SINGLE_TENANT_ID: ${process.env.SINGLE_TENANT_ID}\n`);
        fs.appendFileSync(logFile, `🔌 GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}\n`);

        const result = await CausalImpactService.assessImpact(
            'Test de verificación profundo',
            'Contexto de prueba',
            process.env.SINGLE_TENANT_ID || 'demo-tenant'
        );

        fs.appendFileSync(logFile, '✅ SUCCESS: Service responded\n');
        fs.appendFileSync(logFile, `📊 Result: ${JSON.stringify(result, null, 2)}\n`);
        process.exit(0);
    } catch (error: any) {
        fs.appendFileSync(logFile, '❌ FAILURE: Service threw an error\n');
        fs.appendFileSync(logFile, `Message: ${error.message}\n`);
        fs.appendFileSync(logFile, `Code: ${error.code}\n`);
        fs.appendFileSync(logFile, `Status: ${error.status}\n`);
        if (error.stack) fs.appendFileSync(logFile, `Stack: ${error.stack}\n`);
        if (error.details) fs.appendFileSync(logFile, `Details: ${JSON.stringify(error.details, null, 2)}\n`);
        process.exit(1);
    }
}

verifyEndpoint();
