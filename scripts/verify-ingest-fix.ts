import { extractTextFromPDF } from '../src/lib/pdf-utils';
import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyFix() {
    const url = "https://res.cloudinary.com/ds81rqpk4/raw/upload/v1770656766/abd-rag-platform/tenants/abd_global/documentos-rag/1770656765021_Real%20Decreto%20203-2016%20-%20BOE-A-2016-4953-consolidado";
    const logFile = 'verify_ingest_fix.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('--- VERIFYING EXTRACTION FIX ---');
        log('Fetching buffer from Cloudinary...');
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        log(`Buffer received: ${buffer.length} bytes`);

        log('Calling extractTextFromPDF()...');
        const text = await extractTextFromPDF(buffer);

        log('✅ SUCCESS!');
        log('Text Length: ' + text.length);
        log('Preview: ' + text.substring(0, 500));

    } catch (e: any) {
        log('❌ FAILED!');
        log('Error: ' + e.message);
        if (e.details) log('Details: ' + JSON.stringify(e.details, null, 2));
        log('Stack: ' + e.stack);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        console.log(`Results written to ${logFile}`);
        process.exit(0);
    }
}

verifyFix();
