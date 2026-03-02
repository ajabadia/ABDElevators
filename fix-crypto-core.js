const fs = require('fs');
['src/scripts/test-ingest-logic.ts', 'src/scripts/repro-ingest.ts', 'src/core/application/use-cases/PrepareIngestionUseCase.ts', 'src/core/application/use-cases/ExecuteIngestionAnalysisUseCase.ts'].forEach(f => {
    try {
        if (fs.existsSync(f)) {
            let c = fs.readFileSync(f, 'utf8');
            c = c.replace(/import\s+crypto\s+from\s+['"]crypto['"];?\r?\n?/g, '');
            fs.writeFileSync(f, c);
            console.log('Fixed ' + f);
        }
    } catch (e) {
        console.error(e);
    }
});
