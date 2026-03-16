/**
 * Script para actualizar imports de servicios faltantes
 * Uso: node scripts/fix-missing-imports.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');

const importsToFix = [
    { from: '@/services/admin/NotificationTemplateService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/AdminExportService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/CaseWorkflowService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/ChecklistConfigService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/EnvironmentService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/GoldenSetService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/IngestEnrichmentService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/IngestPredictionService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/IntelligencePatternService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/KnowledgeAssetDownloadService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/KnowledgeAssetManagementService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/KnowledgeAssetPreviewService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/KnowledgeAssetSpaceService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/KnowledgeAssetTraceService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/Neo4jNodeService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/i18nService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/i18nDebugService', to: '@/services/admin/stub-services' },
    { from: '@/services/admin/report-schedule-service', to: '@/services/admin/stub-services' },
];

function getAllTsFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            getAllTsFiles(fullPath, files);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        for (const { from, to } of importsToFix) {
            if (content.includes(`from '${from}'`) || content.includes(`from "${from}"`)) {
                content = content.replace(
                    new RegExp(`from ['"]${from}['"]`, 'g'),
                    `from '${to}'`
                );
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            return { success: true, file: filePath.replace(ROOT_DIR + '\\', '').replace(ROOT_DIR + '/', '') };
        }
        
        return { skipped: true };
        
    } catch (err) {
        return { error: err.message, file: filePath };
    }
}

function main() {
    console.log('🔍 Buscando archivos con imports faltantes...\n');
    
    const files = getAllTsFiles(ROOT_DIR);
    const results = [];
    
    for (const file of files) {
        const result = processFile(file);
        if (result.success) {
            results.push(result);
            console.log(`✅ ${result.file}`);
        }
    }
    
    console.log(`\n📊 Total: ${results.length} archivos actualizados`);
}

main();
