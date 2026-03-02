const fs = require('fs');
const path = require('path');

const listFile = 'files-to-migrate-final.txt';
if (!fs.existsSync(listFile)) {
    console.error('List file not found');
    process.exit(1);
}

let filesContent = fs.readFileSync(listFile, 'utf8');
if (filesContent.charCodeAt(0) === 0xFEFF) {
    filesContent = filesContent.slice(1);
}

const files = filesContent
    .split(/\r?\n/)
    .map(f => f.trim())
    .filter(f => f.length > 0);

console.log(`Processing ${files.length} files...`);

files.forEach(fullPath => {
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Update Import
    content = content.replace(
        /from ['"]@\/lib\/performance-sla['"]/g,
        "from '@/lib/interceptors/performance-interceptor'"
    );

    // Update Usage
    const matchApi = fullPath.match(/src[\\\/]app[\\\/]api[\\\/](.*)[\\\/]route.ts/i);
    const endpointRaw = matchApi ? matchApi[1].replace(/\\/g, '/') : 'unknown-api';

    content = content.replace(
        /withPerformanceSLA\(([\s\S]*?),\s*\{\s*p95:\s*(\d+),\s*max:\s*(\d+)\s*\}\)/g,
        (match, handler, p95, max) => {
            let method = 'API';
            if (match.includes('GET')) method = 'GET';
            else if (match.includes('POST')) method = 'POST';
            else if (match.includes('PATCH')) method = 'PATCH';
            else if (match.includes('DELETE')) method = 'DELETE';

            return `withPerformanceSLA(${handler}, { endpoint: '${method} /api/${endpointRaw}', thresholdMs: ${p95} })`;
        }
    );

    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Migrated: ${fullPath}`);
    }
});
