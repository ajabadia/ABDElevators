const fs = require('fs');
const path = require('path');

const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const targetDirs = [
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'scripts')
];

function updateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // LogEntry keys replacement (regex to avoid replacing unrelated text)
    // We look for patterns like: level: ... , or { level: ... }

    // nivel -> level
    newContent = newContent.replace(/(\s+)nivel: /g, '$1level: ');
    // origen -> source
    newContent = newContent.replace(/(\s+)origen: /g, '$1source: ');
    // accion -> action
    newContent = newContent.replace(/(\s+)accion: /g, '$1action: ');
    // mensaje -> message
    newContent = newContent.replace(/(\s+)mensaje: /g, '$1message: ');
    // detalles -> details
    newContent = newContent.replace(/(\s+)detalles: /g, '$1details: ');
    // correlacion_id -> correlationId (as key)
    newContent = newContent.replace(/(\s+)correlacion_id:/g, '$1correlationId:');

    // Also handle shorthand: { correlationId: correlacion_id} -> { correlationId: correlacion_id } OR just { correlationId } if we renamed var?
    // If code has `const correlacion_id = ...; log({ correlationId: correlacion_id})`, we want `log({ correlationId: correlacion_id })`
    // OR ideally we rename the variable too. But that's harder with regex.
    // For now, let's just fix the key.
    // The previous regex `(\s+)correlacion_id:` handles explicit key `correlacion_id: value`.
    // Shorthand `{ correlationId: correlacion_id,` mismatch `LogEntry` if keys must be `correlationId`.
    // So `{ correlationId: correlacion_id,` -> `{ correlationId: correlacion_id,`
    newContent = newContent.replace(/\{\s*correlacion_id\s*(,|})/g, '{ correlationId: correlacion_id$1');
    newContent = newContent.replace(/,\s*correlacion_id\s*(,|})/g, ', correlationId: correlacion_id$1');

    if (newContent !== content) {
        console.log(`Updating ${filePath}`);
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (validExtensions.includes(path.extname(fullPath))) {
            updateFile(fullPath);
        }
    }
}

targetDirs.forEach(d => processDir(d));
