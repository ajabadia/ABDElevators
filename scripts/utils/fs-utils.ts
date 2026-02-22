
import * as fs from 'fs';
import * as path from 'path';

/**
 * 📂 Script Filesystem Utils
 * Proposito: Utilidades para escanear y manipular archivos en scripts de mantenimiento.
 */
export class FsUtils {
    private static DEFAULT_EXCLUDES = [
        'node_modules',
        '.next',
        '.git',
        'dist',
        'build',
        '.vercel',
        '.gemini'
    ];

    /**
     * Obtiene todos los archivos de forma recursiva con extensiones específicas.
     */
    static getAllFiles(
        dirPath: string,
        extensions: string[] = ['.ts', '.tsx', '.js', '.jsx'],
        options: { excludeDirs?: string[] } = {}
    ): string[] {
        const excludes = [...this.DEFAULT_EXCLUDES, ...(options.excludeDirs || [])];
        let results: string[] = [];

        if (!fs.existsSync(dirPath)) return [];

        const list = fs.readdirSync(dirPath);

        for (const file of list) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                if (excludes.includes(file)) continue;
                results = results.concat(this.getAllFiles(filePath, extensions, options));
            } else {
                if (extensions.some(ext => file.endsWith(ext))) {
                    results.push(filePath);
                }
            }
        }

        return results;
    }

    /**
     * Lee un archivo JSON de forma segura.
     */
    static readJson<T>(filePath: string): T | null {
        try {
            if (!fs.existsSync(filePath)) return null;
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content) as T;
        } catch (error) {
            console.error(`❌ Error reading JSON from ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Escribe un objeto a un archivo JSON.
     */
    static writeJson(filePath: string, data: any): void {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`❌ Error writing JSON to ${filePath}:`, error);
        }
    }
}
