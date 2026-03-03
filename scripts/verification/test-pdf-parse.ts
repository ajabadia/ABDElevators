
import PDFParse from 'pdf-parse';
import fs from 'fs';

async function test() {
    console.log('--- TESTING PDF-PARSE ---');
    console.log('PDFParse type:', typeof PDFParse);

    // Si PDFParse es undefined o no es una función, probamos con require o import dinámico sin .default
    if (typeof PDFParse !== 'function') {
        console.log('PDFParse is not a function. Trying dynamic import...');
        const mod = await import('pdf-parse');
        console.log('Module keys:', Object.keys(mod));
        // @ts-ignore
        console.log('Module as function?:', typeof mod.default);
    }
}

test();
