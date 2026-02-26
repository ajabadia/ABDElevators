const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, 'packages');
const filesToFix = [];

function findFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findFiles(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            filesToFix.push(fullPath);
        }
    }
}
findFiles(packagesDir);

for (const file of filesToFix) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('@/lib/llm')) {
        content = content.replace(/@\/lib\/llm/g, '@/services/llm/llm-service');
        changed = true;
    }
    if (content.includes('@/lib/multilingual-service')) {
        content = content.replace(/@\/lib\/multilingual-service/g, '@/services/core/multilingual-service');
        changed = true;
    }
    if (content.includes('@/lib/workflow-task-service')) {
        content = content.replace(/@\/lib\/workflow-task-service/g, '@/services/ops/WorkflowTaskService');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed imports in', file);
    }
}

// langgraph-rag.ts also needs fixes 
const langgraphPath = path.join(__dirname, 'src/lib/langgraph-rag.ts');
let content = fs.readFileSync(langgraphPath, 'utf8');
if (content.includes('from "./llm"')) {
    content = content.replace(/from "\.\/llm"/g, 'from "@/services/llm/llm-service"');
    fs.writeFileSync(langgraphPath, content, 'utf8');
    console.log('Fixed imports in langgraph-rag.ts');
}
