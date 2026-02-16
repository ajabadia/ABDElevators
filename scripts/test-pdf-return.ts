import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testReturnStructure() {
    const url = "https://res.cloudinary.com/ds81rqpk4/raw/upload/v1770656766/abd-rag-platform/tenants/abd_global/documentos-rag/1770656765021_Real%20Decreto%20203-2016%20-%20BOE-A-2016-4953-consolidado";
    const logFile = 'return_structure_test.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('Fetching buffer...');
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const uint8 = new Uint8Array(buffer);

        log('Importing pdf-parse...');
        const mod = await import('pdf-parse');
        const PDFParse = (mod as any).default || (mod as any).PDFParse || mod;

        log('Instantiating PDFParse...');
        const instance = new PDFParse(uint8);

        log('Calling load()...');
        if (instance.load) await instance.load();

        log('Calling getText()...');
        const result = await instance.getText();

        log('Result Type: ' + typeof result);
        log('Result Keys: ' + (result ? Object.keys(result).join(', ') : 'null/undefined'));
        log('Result Stringified: ' + JSON.stringify(result).substring(0, 1000));

    } catch (e: any) {
        log('❌ Error: ' + e.message);
        log('Stack: ' + e.stack);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        process.exit(0);
    }
}

testReturnStructure();
