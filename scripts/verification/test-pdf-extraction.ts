import { extractTextFromPDF } from '../src/lib/pdf-utils';
import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testExtraction() {
    const url = "https://res.cloudinary.com/ds81rqpk4/raw/upload/v1770656766/abd-rag-platform/tenants/abd_global/documentos-rag/1770656765021_Real%20Decreto%20203-2016%20-%20BOE-A-2016-4953-consolidado";
    const logFile = 'test_extraction_results.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('--- STARTING PDF EXTRACTION TEST ---');
        log('URL: ' + url);

        log('Fetching from Cloudinary...');
        const response = await fetch(url);
        if (!response.ok) {
            log(`❌ Fetch failed: ${response.status} ${response.statusText}`);
            return;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        log(`✅ Buffer received: ${buffer.length} bytes`);
        if (buffer.length > 5) {
            log(`Magic bytes (hex): ${buffer.toString('hex', 0, 5)}`);
            log(`Magic bytes (ascii): ${buffer.toString('utf8', 0, 5)}`);
        }

        log('Starting extractTextFromPDF...');
        try {
            const text = await extractTextFromPDF(buffer);
            log('✅ Extraction successful!');
            log('Text Length: ' + text.length);
            log('Preview: ' + text.substring(0, 500));
        } catch (extractionError: any) {
            log('❌ Extraction failed inside helper:');
            log('Message: ' + extractionError.message);
            if (extractionError.details) {
                log('Details: ' + JSON.stringify(extractionError.details, null, 2));
            }
            if (extractionError.stack) {
                log('Stack: ' + extractionError.stack);
            }
        }

    } catch (e: any) {
        log('❌ Critical script error: ' + e.message);
        log('Stack: ' + e.stack);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        console.log(`Results written to ${logFile}`);
        process.exit(0);
    }
}

testExtraction();
