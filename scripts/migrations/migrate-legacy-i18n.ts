import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateLocale(locale: string) {
    const rootDir = path.resolve(__dirname, '..');
    const legacyPath = path.join(rootDir, 'messages', `${locale}.json`);
    const modularDir = path.join(rootDir, 'messages', locale);

    console.log(`\n🚀 Starting migration for locale: ${locale}`);

    try {
        const legacyContent = await fs.readFile(legacyPath, 'utf-8');
        const legacyJson = JSON.parse(legacyContent);

        // Ensure modular directory exists
        await fs.mkdir(modularDir, { recursive: true });

        const namespaces = Object.keys(legacyJson);
        console.log(`Found ${namespaces.length} namespaces in legacy file.`);

        for (const namespace of namespaces) {
            const modularFilePath = path.join(modularDir, `${namespace}.json`);
            let modularJson: Record<string, any> = {};
            let isNewFile = false;

            // Load existing modular file if it exists
            try {
                const modularContent = await fs.readFile(modularFilePath, 'utf-8');
                modularJson = JSON.parse(modularContent);
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    isNewFile = true;
                } else {
                    console.error(`Error reading ${modularFilePath}:`, error);
                    continue;
                }
            }

            const legacyNamespaceContent = legacyJson[namespace];
            let keysAdded = 0;

            // Merge keys: Add legacy keys only if they don't exist in modular
            // Recursive merge helper
            const mergeObjects = (target: any, source: any) => {
                let addedCount = 0;
                for (const key in source) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        if (!target[key]) {
                            target[key] = {};
                            addedCount++; // Counting the object creation as a change, or strictly leaf nodes? Let's count keys.
                        }
                        addedCount += mergeObjects(target[key], source[key]);
                    } else {
                        if (target[key] === undefined) {
                            target[key] = source[key];
                            addedCount++;
                        }
                        // If target[key] exists, we DO NOT overwrite.
                        // "los que existan y estén traducidos en el namespace, no lo sobreescribas."
                    }
                }
                return addedCount;
            };

            keysAdded = mergeObjects(modularJson, legacyNamespaceContent);

            if (keysAdded > 0 || isNewFile) {
                await fs.writeFile(modularFilePath, JSON.stringify(modularJson, null, 2), 'utf-8');
                console.log(`  ✅ ${namespace}: ${isNewFile ? 'Created' : 'Updated'} (${keysAdded} keys merged)`);
            } else {
                console.log(`  Examining ${namespace}: No new keys to merge.`);
            }
        }

        console.log(`🏁 Migration for ${locale} complete.`);

    } catch (error) {
        console.error(`❌ Error migrating ${locale}:`, error);
    }
}

async function main() {
    await migrateLocale('es');
    await migrateLocale('en');
}

main().catch(console.error);
