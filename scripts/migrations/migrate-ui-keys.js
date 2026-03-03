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

    // UI Keys replacement
    // Caution: naive replacement might break strings. But we assume most are property access or object keys.

    // .name or : name
    newContent = newContent.replace(/(\.|:\s*)nombre\b/g, '$1name');

    // .icon or : icon
    newContent = newContent.replace(/(\.|:\s*)icono\b/g, '$1icon');

    // .priority or : priority
    newContent = newContent.replace(/(\.|:\s*)prioridad\b/g, '$1priority');

    // .categories or : categories
    newContent = newContent.replace(/(\.|:\s*)categorias\b/g, '$1categories');

    // .active or : active
    newContent = newContent.replace(/(\.|:\s*)activo\b/g, '$1active');

    // .workflowOrder or : workflowOrder
    newContent = newContent.replace(/(\.|:\s*)workflow_orden\b/g, '$1workflowOrder');

    // .text or : text
    newContent = newContent.replace(/(\.|:\s*)texto\b/g, '$1text');

    // .model or : model
    newContent = newContent.replace(/(\.|:\s*)modelo\b/g, '$1model');

    // .cloudinaryUrl or : cloudinaryUrl
    newContent = newContent.replace(/(\.|:\s*)cloudinary_url\b/g, '$1cloudinaryUrl');

    // .isShadow or : isShadow
    newContent = newContent.replace(/(\.|:\s*)is_shadow\b/g, '$1isShadow');

    // .originalLang or : originalLang
    newContent = newContent.replace(/(\.|:\s*)original_lang\b/g, '$1originalLang');

    // .refChunkId or : refChunkId
    newContent = newContent.replace(/(\.|:\s*)ref_chunk_id\b/g, '$1refChunkId');

    // .creado or : creado -> createdAt? Wait, check usage. Maybe verify first.
    // .actualizado or : actualizado -> updatedAt? Wait.
    // .identifier or : identifier -> identifier
    newContent = newContent.replace(/(\.|:\s*)numeroPedido\b/g, '$1identifier');

    // .name or : name -> name
    newContent = newContent.replace(/(\.|:\s*)nombreObra\b/g, '$1name');

    // .createdAt or : createdAt -> createdAt
    newContent = newContent.replace(/(\.|:\s*)fechaCreacion\b/g, '$1createdAt');

    // .status or : status -> status. Dangerous but common. 
    // Usually 'status' is better.
    newContent = newContent.replace(/(\.|:\s*)estado\b/g, '$1status');

    // .entityType or : entityType -> entityType
    newContent = newContent.replace(/(\.|:\s*)entity_type\b/g, '$1entityType');

    // .type or : type. This is dangerous. 
    // Only if surrounded by specific context?
    // Let's rely on type checker for 'tipo' if it's too risky.
    // But 'r.type' in 'scripts/demo-legal-risk.ts' was manual fix.
    // 'RagResult.type' -> 'RagResult.type'.
    // 'obj.type' -> 'obj.type'.
    newContent = newContent.replace(/(\.|:\s*)tipo\b/g, '$1type');

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
