import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFinalUsage() {
    const url = "https://res.cloudinary.com/ds81rqpk4/raw/upload/v1770656766/abd-rag-platform/tenants/abd_global/documentos-rag/1770656765021_Real%20Decreto%20203-2016%20-%20BOE-A-2016-4953-consolidado";
    const logFile = 'final_usage_test.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('Fetching buffer...');
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        // Explicitly convert to Uint8Array
        const uint8 = new Uint8Array(buffer);

        log('Importing pdf-parse...');
        const mod = await import('pdf-parse');
        const PDFParse = (mod as any).default || (mod as any).PDFParse || mod;

        log('Instantiating PDFParse with Uint8Array...');
        const instance = new PDFParse(uint8);

        log('Calling load()...');
        if (instance.load) await instance.load();

        log('Calling getText()...');
        const text = await instance.getText();

        log('✅ Success! Text Length: ' + text.length);
        log('Preview: ' + text.substring(0, 500));

    } catch (e: any) {
        log('❌ Error: ' + e.message);
        log('Stack: ' + e.stack);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        console.log(`Results written to ${logFile}`);
        process.exit(0);
    }
}

testFinalUsage();
