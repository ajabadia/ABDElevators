const fs = require('fs');
const path = require('path');

const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const targetDirs = [
    path.join(process.cwd(), 'src'),
    path.join(process.cwd(), 'scripts') // also scripts/tests?
];

function updateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Imports replacement

    // @/components/profile/ -> @/components/profile/
    newContent = newContent.replace(/@\/components\/perfil\//g, '@/components/profile/');

    // @/components/entities/ -> @/components/entities/
    newContent = newContent.replace(/@\/components\/pedidos\//g, '@/components/entities/');

    // @/components/agent/ -> @/components/agent/
    newContent = newContent.replace(/@\/components\/agente\//g, '@/components/agent/');

    // @/components/technical/ -> @/components/technical/
    newContent = newContent.replace(/@\/components\/tecnico\//g, '@/components/technical/');

    // Import Entity -> Entity from schemas
    // import { ..., Entity, ... } 
    // If we replace 'Entity' with 'Entity' in import list.
    newContent = newContent.replace(/import\s*{([^}]*)\bPedido\b([^}]*)}\s*from\s*['"]@\/lib\/schemas['"]/g, 'import {$1Entity$2} from \'@/lib/schemas\'');

    // Also Usage: Entity -> Entity
    // This is distinct from 'pedido.variable' which is valid if variable name is pedido.
    // But type usage: p: Entity -> p: Entity
    // new Entity() -> new Entity()
    // <Entity ... />
    // We can replace whole word Entity matching constraints
    newContent = newContent.replace(/\bPedido\b/g, 'Entity');

    // ValidationItem -> ValidationItem
    newContent = newContent.replace(/\bItemValidacion\b/g, 'ValidationItem');

    if (newContent !== content) {
        console.log(`Updating imports in ${filePath}`);
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
