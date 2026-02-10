import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectModule() {
    const logFile = 'module_inspection.log';
    let logBuffer = '';
    const log = (msg: string) => { logBuffer += msg + '\n'; console.log(msg); };

    try {
        log('Importing pdf-parse...');
        const mod = await import('pdf-parse');
        log('Module Keys: ' + Object.keys(mod).join(', '));
        log('Module Type: ' + typeof mod);

        const defaultExport = (mod as any).default;
        log('Default Export Type: ' + typeof defaultExport);
        if (defaultExport) {
            log('Default Export Keys: ' + Object.keys(defaultExport).join(', '));
            log('Default Export String: ' + String(defaultExport).substring(0, 100));
        }

        const PDFParse = (mod as any).default || (mod as any).PDFParse || mod;
        log('Resolved PDFParse Type: ' + typeof PDFParse);
        log('Resolved PDFParse String: ' + String(PDFParse).substring(0, 100));

    } catch (e: any) {
        log('❌ Critical script error: ' + e.message);
        log('Stack: ' + e.stack);
    } finally {
        fs.writeFileSync(logFile, logBuffer);
        process.exit(0);
    }
}

inspectModule();
