const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
    console.error('Uso: node fix-es-encoding.js <archivo.json>');
    process.exit(1);
}

const absolutePath = path.resolve(filePath);

if (!fs.existsSync(absolutePath)) {
    console.error(`Error: El archivo ${absolutePath} no existe.`);
    process.exit(1);
}

try {
    let content = fs.readFileSync(absolutePath, 'utf8');

    // Mapa de corrupciones comunes de UTF-8 (Double encoding o mal interpretado)
    const replacements = [
        { from: /Ã¡/g, to: 'á' },
        { from: /Ã©/g, to: 'é' },
        { from: /Ã\xed/g, to: 'í' },
        { from: /Ã³/g, to: 'ó' },
        { from: /Ãº/g, to: 'ú' },
        { from: /Ã±/g, to: 'ñ' },
        { from: /Ã\x81/g, to: 'Á' },
        { from: /Ã\x89/g, to: 'É' },
        { from: /Ã\x8d/g, to: 'Í' },
        { from: /Ã\x93/g, to: 'Ó' },
        { from: /Ã\x9a/g, to: 'Ú' },
        { from: /Ã\x91/g, to: 'Ñ' },
        { from: /Â¿/g, to: '¿' },
        { from: /Â¡/g, to: '¡' },
        { from: /Ãª/g, to: 'ê' },
        { from: /Ã\xa9/g, to: 'é' },
        { from: /Â/g, to: '' } // A veces aparece como prefijo fantasma
    ];

    let fixedContent = content;
    replacements.forEach(rep => {
        fixedContent = fixedContent.replace(rep.from, rep.to);
    });

    // Validar si el resultado es JSON válido
    try {
        const json = JSON.parse(fixedContent);
        // Reformatear con 2 espacios para consistencia
        fixedContent = JSON.stringify(json, null, 2);
        console.log(`JSON validado y formateado para ${path.basename(filePath)}`);
    } catch (e) {
        console.warn(`Advertencia: El contenido procesado para ${path.basename(filePath)} no es un JSON válido tras la corrección. Se guardará sin formatear.`);
    }

    fs.writeFileSync(absolutePath, fixedContent, 'utf8');
    console.log(`✓ Archivo corregido: ${filePath}`);

} catch (error) {
    console.error(`Error procesando el archivo: ${error.message}`);
    process.exit(1);
}
