
import fs from 'fs';
import path from 'path';

function getAllRoutes(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllRoutes(filePath, fileList);
        } else if (file === 'route.ts') {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const apiDir = path.resolve(process.cwd(), 'src/app/api');
const routes = getAllRoutes(apiDir);

const results = routes.map(route => {
    const content = fs.readFileSync(route, 'utf8');
    return {
        path: route.replace(process.cwd(), ''),
        hasPermission: content.includes('enforcePermission'),
        hasSLA: content.includes('withPerformanceSLA')
    };
});

const missingPermission = results.filter(r => !r.hasPermission).map(r => r.path);
const missingSLA = results.filter(r => !r.hasSLA).map(r => r.path);

const output = {
    totalRoutes: routes.length,
    missingPermission,
    missingSLA
};

fs.writeFileSync('audit_results.json', JSON.stringify(output, null, 2));
console.log('Results written to audit_results.json');
