/**
 * Script para reemplazar catch (error: any) por catch (error: unknown) + helper
 * Uso: node scripts/fix-any-errors.js [limit]
 * 
 * Con limit: procesa solo esos archivos para validación
 * Sin limit: procesa todos
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');
const LIMIT = process.argv[2] ? parseInt(process.argv[2]) : null;

// Archivos a omitir (ya procesados o no afectan)
const SKIP_FILES = [
    'errors-helpers.ts',
    'api-keys.ts', // tiene problemas de tipos distintos
];

function getAllTsxFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            getAllTsxFiles(fullPath, files);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function findCatchAnyBlocks(content) {
    const regex = /catch\s*\(\s*error\s*:\s*any\s*\)/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        matches.push({
            index: match.index,
            line: lineNum,
            text: match[0]
        });
    }
    
    return matches;
}

function replaceCatchBlock(content) {
    let result = content;
    let replacements = 0;
    
    // Verificar si ya tiene el import
    const hasHelperImport = result.includes("from '@/lib/errors-helpers'") || 
                          result.includes('from "@/lib/errors-helpers"');
    
    // Agregar import si no existe y hay catch blocks
    if (!hasHelperImport && result.includes('catch (error: any)')) {
        // Buscar un import de react para agregar después
        const reactImportMatch = result.match(/^import\s+.*\s+from\s+['"]react['"];?\s*$/m);
        if (reactImportMatch) {
            result = result.replace(
                reactImportMatch[0],
                reactImportMatch[0] + "\nimport { getErrorMessage } from '@/lib/errors-helpers';"
            );
        } else {
            // Buscar cualquier import para agregar al inicio
            const firstImportMatch = result.match(/^import\s+/m);
            if (firstImportMatch) {
                result = result.replace(
                    firstImportMatch[0],
                    "import { getErrorMessage } from '@/lib/errors-helpers';\nimport "
                );
            }
        }
    }
    
    // Reemplazar cada catch (error: any)
    const regex = /catch\s*\(\s*error\s*:\s*any\s*\)([^{]*\{)/g;
    result = result.replace(regex, (match, blockStart) => {
        replacements++;
        
        // Detectar si usa error.message o solo error
        const fullMatch = match + blockStart;
        const usesMessage = content.includes('error.message');
        
        if (usesMessage || blockStart.includes('{')) {
            return `catch (error: unknown)${blockStart}`;
        }
        
        return `catch (error: unknown)${blockStart}`;
    });
    
    // Reemplazar error.message por getErrorMessage(error) en los catch blocks
    // Solo si el import fue agregado
    if (replacements > 0) {
        // Reemplazar .message por getErrorMessage(error)
        result = result.replace(
            /error\.message(?!\s*\(\s*\))/g,
            'getErrorMessage(error)'
        );
        
        // Reemplazar error.stack si existe
        result = result.replace(
            /error\.stack/g,
            'error instanceof Error ? error.stack : undefined'
        );
    }
    
    return { content: result, replacements };
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Skip si ya está procesado o no tiene catch any
        if (!content.includes('catch (error: any)')) {
            return { skipped: true, replacements: 0 };
        }
        
        const matches = findCatchAnyBlocks(content);
        
        // Reemplazar
        const { content: newContent, replacements } = replaceCatchBlock(content);
        
        if (replacements > 0) {
            // Backup
            const backupPath = filePath + '.backup';
            fs.writeFileSync(backupPath, content);
            
            // Escribir nuevo
            fs.writeFileSync(filePath, newContent);
            
            return { 
                success: true, 
                file: filePath.replace(ROOT_DIR + '\\', '').replace(ROOT_DIR + '/', ''),
                replacements,
                lines: matches.map(m => m.line)
            };
        }
        
        return { skipped: true, replacements: 0 };
        
    } catch (err) {
        return { error: err.message, file: filePath };
    }
}

function main() {
    console.log('🔍 Buscando archivos con catch (error: any)...\n');
    
    const files = getAllTsxFiles(ROOT_DIR);
    const filesWithCatch = files.filter(f => {
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('catch (error: any)');
    });
    
    // Filtrar archivos a omitir
    const filteredFiles = filesWithCatch.filter(f => {
        const fileName = path.basename(f);
        return !SKIP_FILES.includes(fileName);
    });
    
    console.log(`📁 Encontrados ${filteredFiles.length} archivos con catch (error: any)`);
    
    // Limitar si se especifica
    const filesToProcess = LIMIT ? filteredFiles.slice(0, LIMIT) : filteredFiles;
    const totalToProcess = LIMIT ? filteredFiles.length : filesToProcess.length;
    
    console.log(`⚙️  Procesando ${filesToProcess.length} archivos${LIMIT ? ` (limitado de ${totalToProcess})` : ''}\n`);
    
    const results = [];
    
    for (const file of filesToProcess) {
        const result = processFile(file);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ ${result.file}`);
            console.log(`   └─ ${result.replacements} reemplazo(s), líneas: ${result.lines.join(', ')}`);
        } else if (result.skipped) {
            console.log(`⏭️  ${path.basename(file)} (sin cambios)`);
        } else if (result.error) {
            console.log(`❌ ${result.file}: ${result.error}`);
        }
    }
    
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => r.error).length;
    const skipped = results.filter(r => r.skipped).length;
    
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Exitosos: ${success}`);
    console.log(`   ❌ Errores: ${failed}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   📁 Total: ${results.length}`);
    
    if (LIMIT && success > 0) {
        console.log(`\n⚠️  Procesamiento limitado. Para continuar con los demás:`);
        console.log(`   node scripts/fix-any-errors.js ${LIMIT + success}`);
    }
    
    // Limpiar backups si todo OK
    if (failed === 0) {
        files.forEach(f => {
            const backup = f + '.backup';
            if (fs.existsSync(backup)) {
                fs.unlinkSync(backup);
            }
        });
    }
}

main();
