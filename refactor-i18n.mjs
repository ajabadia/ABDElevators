import fs from 'fs';
import path from 'path';

function refactorFile(lang) {
    const filePath = path.join(process.cwd(), 'messages', `${lang}.json`);
    console.log(`\n--- Refactoring ${lang}.json ---`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 1. Asegurar que 'common' exista
    if (!data.common) data.common = {};

    // 2. Buscar secciones en 'profile' y moverlas a 'common'
    if (data.profile) {
        ['search', 'spaces', 'enterpriseSecurity'].forEach(sec => {
            if (data.profile[sec]) {
                console.log(`📦 Moving profile.${sec} to common.${sec}`);
                data.common[sec] = data.profile[sec];
                delete data.profile[sec];
            }
        });
    }

    // 3. Buscar secciones en 'knowledge_assets' y moverlas/unirlas a 'common'
    if (data.knowledge_assets && data.knowledge_assets.spaces) {
        console.log(`📦 Moving knowledge_assets.spaces to common.spaces (merging)`);
        data.common.spaces = { ...data.common.spaces, ...data.knowledge_assets.spaces };
        delete data.knowledge_assets.spaces;
    }

    // 4. Limpieza de 'common.spaces' (si era un string simple, convertir a objeto o viceversa según convenga)
    // En es.json línea 151 había un '"spaces": "Espacios"'
    if (typeof data.common.spaces === 'string') {
        const title = data.common.spaces;
        data.common.spaces = { title };
    }

    // 5. Escribir de nuevo con formato estándar
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`✅ ${lang}.json refactored successfully.`);
}

refactorFile('es');
refactorFile('en');
