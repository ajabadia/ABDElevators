import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectPrototype() {
    const logFile = 'prototype_inspection.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('Importing pdf-parse...');
        const mod = await import('pdf-parse');
        const PDFParse = (mod as any).default || (mod as any).PDFParse || mod;

        log('Resolved PDFParse Name: ' + PDFParse.name);
        log('Is Class (ToString): ' + String(PDFParse).startsWith('class'));

        if (PDFParse.prototype) {
            log('Prototype Methods: ' + Object.getOwnPropertyNames(PDFParse.prototype).join(', '));
        }

        // Try to instantiate with empty buffer to see what it has
        try {
            const instance = new PDFParse(Buffer.from([]));
            log('Instance Keys: ' + Object.keys(instance).join(', '));
            log('Instance Methods: ' + Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).join(', '));
        } catch (e: any) {
            log('Instantiation error (expected): ' + e.message);
        }

    } catch (e: any) {
        log('❌ Critical error: ' + e.message);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        process.exit(0);
    }
}

inspectPrototype();
