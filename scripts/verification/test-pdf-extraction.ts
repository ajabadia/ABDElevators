import { extractTextFromPDF } from '../../src/lib/pdf-utils';
import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testExtraction() {
    const localPath = path.resolve(process.cwd(), 'Documentación/ejemplos/ascensores/boe/Real Decreto 203-2016/Real Decreto 203-2016 - BOE-A-2016-4953-consolidado.pdf');
    const logFile = 'test_extraction_results.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('--- STARTING PDF EXTRACTION TEST ---');
        log('Local Path: ' + localPath);

        log('Reading from disk...');
        if (!fs.existsSync(localPath)) {
            log(`❌ File not found: ${localPath}`);
            return;
        }

        const buffer = fs.readFileSync(localPath);
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
