
import fs from 'fs';
import path from 'path';

const baseDir = './messages/es';
const srcDir = './src';
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));

const usage = {};
files.forEach(f => usage[f] = 0);

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            files.forEach(ns => {
                if (content.includes(`'${ns}'`) || content.includes(`"${ns}"`) || content.includes(`'${ns}.`) || content.includes(`"${ns}.`)) {
                    usage[ns]++;
                }
            });
        }
    });
}

walk(srcDir);

let out = '--- NAMESPACE USAGE STATS ---\n';
for (const [ns, count] of Object.entries(usage)) {
    out += `${ns}: ${count} references\n`;
}
fs.writeFileSync('./tmp/i18n-usage-audit.txt', out);
