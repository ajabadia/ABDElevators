const { PDFExportService } = require('./src/services/security/PDFExportService');
const fs = require('fs');
const path = require('path');

// Mock content
const md = `
# Evidence Report
## Section 1
This is a test report for SGSI certification.
### 1.1 Control
| Metric | Value |
| -- | -- |
| Test | OK |
`;

async function test() {
    console.log("Testing PDF Generation...");
    const out = path.join(process.cwd(), 'tmp', 'test-report.pdf');
    if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) fs.mkdirSync(path.join(process.cwd(), 'tmp'));
    
    try {
        const hash = await PDFExportService.generateCertifiedPDF(md, out, {
            title: "TEST REPORT",
            period: "March 2026",
            emitter: "ABD TEST"
        });
        console.log("PDF Created successfully!");
        console.log("Integrity Hash:", hash);
    } catch (e) {
        console.error("Failed:", e);
    }
}

test();
