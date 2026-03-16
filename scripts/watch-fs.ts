
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
console.log(`Watching ${root}...`);

const EXCLUDE = ['.git', 'node_modules', '.next'];

function watchDir(dir: string) {
    fs.watch(dir, { recursive: true }, (event, filename) => {
        if (!filename) return;
        const fullPath = path.join(dir, filename);
        if (EXCLUDE.some(ex => filename.includes(ex))) return;
        
        try {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                console.log(`[WATCH] ${event}: ${filename} (at ${new Date().toISOString()})`);
            }
        } catch (e) {
            // File might have been deleted
            console.log(`[WATCH] ${event}: ${filename} (DELETED/MISSING)`);
        }
    });
}

watchDir(root);

// Keep alive for 30s
setTimeout(() => {
    console.log('Done watching.');
    process.exit(0);
}, 30000);
