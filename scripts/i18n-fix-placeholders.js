/**
 * Fix i18n placeholders for admin.knowledge namespace
 * Based on code analysis of KnowledgeExplorer.tsx and AgenticSupportSearch.tsx
 * 
 * Usage: node scripts/i18n-fix-placeholders.js
 */

const fs = require('fs');
const path = require('path');

const translations = {
    // ── Tabs ──
    'admin.knowledge.tabs.explorer': { es: 'Explorador', en: 'Explorer' },
    'admin.knowledge.tabs.ai': { es: 'Consulta Inteligente', en: 'AI Query' },

    // ── Actions ──
    'admin.knowledge.actions.export': { es: 'Exportar datos', en: 'Export data' },
    'admin.knowledge.actions.sim_btn': { es: 'Simular', en: 'Simulate' },
    'admin.knowledge.actions.refresh': { es: 'Actualizar', en: 'Refresh' },

    // ── Header ──
    'admin.knowledge.explorer_h2': { es: 'Base de Conocimiento', en: 'Knowledge Base' },
    'admin.knowledge.explorer_subtitle': { es: 'Explora y busca en los chunks de tu base de conocimiento', en: 'Explore and search your knowledge base chunks' },

    // ── Stats cards ──
    'admin.knowledge.stats.total': { es: 'Chunks Totales', en: 'Total Chunks' },
    'admin.knowledge.stats.arch': { es: 'Arquitectura', en: 'Architecture' },
    'admin.knowledge.stats.langs': { es: 'Idiomas soportados', en: 'Supported languages' },
    'admin.knowledge.stats.backend': { es: 'Backend', en: 'Backend' },
    'admin.knowledge.stats.synced': { es: 'Sincronizado', en: 'Synced' },

    // ── Simulator ──
    'admin.knowledge.simulator.title': { es: 'Simulador de Búsqueda Semántica', en: 'Semantic Search Simulator' },
    'admin.knowledge.simulator.subtitle': { es: 'Prueba la búsqueda semántica con consultas en lenguaje natural', en: 'Test semantic search with natural language queries' },
    'admin.knowledge.simulator.placeholder': { es: 'Escribe una consulta técnica...', en: 'Type a technical query...' },

    // ── Filters ──
    'admin.knowledge.filters.title': { es: 'Filtros', en: 'Filters' },
    'admin.knowledge.filters.query_placeholder': { es: 'Buscar en chunks...', en: 'Search chunks...' },
    'admin.knowledge.filters.lang_label': { es: 'Idioma', en: 'Language' },
    'admin.knowledge.filters.lang_all': { es: 'Todos los idiomas', en: 'All languages' },
    'admin.knowledge.filters.type_label': { es: 'Tipo', en: 'Type' },
    'admin.knowledge.filters.type_all': { es: 'Todos los tipos', en: 'All types' },
    'admin.knowledge.filters.type_original': { es: 'Original', en: 'Original' },
    'admin.knowledge.filters.type_shadow': { es: 'Shadow (traducción)', en: 'Shadow (translated)' },

    // ── View (chunk list) ──
    'admin.knowledge.view.showing': { es: 'Mostrando {count} de {total}', en: 'Showing {count} of {total}' },
    'admin.knowledge.view.loading': { es: 'Cargando chunks...', en: 'Loading chunks...' },
    'admin.knowledge.view.empty_title': { es: 'Sin resultados', en: 'No results' },
    'admin.knowledge.view.empty_subtitle': { es: 'No se encontraron chunks con los filtros actuales', en: 'No chunks found with current filters' },
    'admin.knowledge.view.chunk_shadow': { es: 'Shadow', en: 'Shadow' },
    'admin.knowledge.view.chunk_original': { es: 'Original', en: 'Original' },
    'admin.knowledge.view.chunk_model': { es: 'Modelo', en: 'Model' },
    'admin.knowledge.view.chunk_type': { es: 'Tipo', en: 'Type' },
    'admin.knowledge.view.auto_trans': { es: 'Traducción automática', en: 'Auto-translation' },
    'admin.knowledge.view.dual_mechanism': { es: 'Mecanismo Dual', en: 'Dual Mechanism' },
    'admin.knowledge.view.dual_desc': { es: 'Chunk original y su contraparte traducida coexisten para mejorar la precisión multilingüe', en: 'Original chunk and its translated counterpart coexist to improve multilingual accuracy' },
    'admin.knowledge.view.prev': { es: 'Anterior', en: 'Previous' },
    'admin.knowledge.view.next': { es: 'Siguiente', en: 'Next' },

    // ── Brain (AgenticSupportSearch) ──
    'admin.knowledge.brain.title': { es: 'Inteligencia Técnica', en: 'Technical Intelligence' },
    'admin.knowledge.brain.description': { es: 'Consulta inteligente sobre tu base de conocimiento técnico', en: 'Intelligent query on your technical knowledge base' },
    'admin.knowledge.brain.placeholder': { es: '¿Qué necesitas saber sobre mantenimiento de ascensores?', en: 'What do you need to know about elevator maintenance?' },
    'admin.knowledge.brain.thinking': { es: 'Pensando...', en: 'Thinking...' },
    'admin.knowledge.brain.submit': { es: 'Consultar', en: 'Search' },
    'admin.knowledge.brain.investigating': { es: 'Investigando...', en: 'Investigating...' },
    'admin.knowledge.brain.investigating_desc': { es: 'Analizando tu base de conocimiento con inteligencia técnica', en: 'Analyzing your knowledge base with technical intelligence' },
    'admin.knowledge.brain.verified_badge': { es: 'Verificado', en: 'Verified' },
    'admin.knowledge.brain.hide_trace': { es: 'Ocultar traza', en: 'Hide trace' },
    'admin.knowledge.brain.show_trace': { es: 'Ver traza', en: 'Show trace' },
    'admin.knowledge.brain.trace_title': { es: 'Traza de Razonamiento', en: 'Reasoning Trace' },
    'admin.knowledge.brain.trace_footer': { es: 'Razonamiento completado', en: 'Reasoning completed' },
    'admin.knowledge.brain.sources_title': { es: 'Fuentes de referencia', en: 'Reference sources' },
    'admin.knowledge.brain.manual_label': { es: 'Manual', en: 'Manual' },
    'admin.knowledge.brain.score_label': { es: 'Score', en: 'Score' },

    // ── Brain examples ──
    'admin.knowledge.brain.examples.torque.title': { es: 'Par motor', en: 'Motor torque' },
    'admin.knowledge.brain.examples.torque.desc': { es: 'Especificaciones técnicas de par', en: 'Torque technical specifications' },
    'admin.knowledge.brain.examples.torque.query': { es: '¿Cuál es el par motor recomendado para un ascensor de 630 kg?', en: 'What is the recommended motor torque for a 630 kg elevator?' },
    'admin.knowledge.brain.examples.safety.title': { es: 'Seguridad', en: 'Safety' },
    'admin.knowledge.brain.examples.safety.desc': { es: 'Normativas y protocolos de seguridad', en: 'Safety regulations and protocols' },
    'admin.knowledge.brain.examples.safety.query': { es: '¿Qué normas de seguridad aplican al sistema de frenado?', en: 'What safety regulations apply to the braking system?' },
    'admin.knowledge.brain.examples.quantum.title': { es: 'Mantenimiento', en: 'Maintenance' },
    'admin.knowledge.brain.examples.quantum.desc': { es: 'Guías de mantenimiento preventivo', en: 'Preventive maintenance guides' },
    'admin.knowledge.brain.examples.quantum.query': { es: '¿Cada cuánto se debe revisar el sistema de tracción?', en: 'How often should the traction system be inspected?' },

    // ── Brain Federated ──
    'admin.knowledge.brain_federated.title': { es: 'Sugerencias de Inteligencia Colectiva', en: 'Collective Intelligence Suggestions' },
    'admin.knowledge.brain_federated.investigating': { es: 'Consultando fuentes federadas...', en: 'Querying federated sources...' },
    'admin.knowledge.brain_federated.match': { es: 'Coincidencia', en: 'Match' },
};

function setNestedKey(obj, flatKey, value) {
    const parts = flatKey.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function flattenObject(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, newKey));
        } else {
            result[newKey] = String(val);
        }
    }
    return result;
}

// Main
const esPath = path.join(process.cwd(), 'messages', 'es.json');
const enPath = path.join(process.cwd(), 'messages', 'en.json');

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

let replaced = 0;
let added = 0;

for (const [key, { es: esVal, en: enVal }] of Object.entries(translations)) {
    // Check if key exists and is a placeholder
    const flatEs = flattenObject(es);
    if (flatEs[key] && flatEs[key].startsWith('[TRADUCIR]')) {
        setNestedKey(es, key, esVal);
        setNestedKey(en, key, enVal);
        replaced++;
    } else if (!flatEs[key]) {
        setNestedKey(es, key, esVal);
        setNestedKey(en, key, enVal);
        added++;
    }
    // If key already exists with a non-placeholder value, skip
}

fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

// Count remaining placeholders
const finalFlatEs = flattenObject(es);
const remaining = Object.entries(finalFlatEs).filter(([, v]) => v.startsWith('[TRADUCIR]'));

console.log(`✅ Replaced ${replaced} placeholder keys`);
console.log(`✅ Added ${added} new keys`);
console.log(`📋 Remaining placeholders: ${remaining.length}`);
if (remaining.length > 0) {
    remaining.forEach(([k]) => console.log(`  - ${k}`));
}
console.log(`📊 Final es.json: ${Object.keys(finalFlatEs).length} keys`);
