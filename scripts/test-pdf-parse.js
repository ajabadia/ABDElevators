const fs = require('fs');

async function testPdfParse() {
    try {
        console.log('Testing dynamic import of pdf-parse...');
        const mod = await import('pdf-parse');

        console.log('Module keys:', Object.keys(mod));
        const PDFParse = mod.default || mod;
        console.log('PDFParse type:', typeof PDFParse);

        if (typeof PDFParse !== 'function') {
            console.error('FAILED: PDFParse is not a function');
            return;
        }

        // Test with a dummy PDF buffer or empty buffer
        console.log('Testing with a small dummy buffer...');
        const buffer = Buffer.alloc(10); // Not a real PDF, but let's see if it throws normally
        try {
            await PDFParse(buffer);
        } catch (e) {
            console.log('Caught expected error from invalid PDF:', e.message);
        }

        console.log('SUCCESS: pdf-parse seems to be working as a function.');
    } catch (err) {
        console.error('CRITICAL ERROR in test:', err);
    }
}

testPdfParse();
