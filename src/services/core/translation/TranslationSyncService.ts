
import fs from 'fs';
import path from 'path';
import { AnyBulkWriteOperation, Document } from 'mongodb';
import { I18nObjectUtils } from '@/lib/i18n/i18n-object-utils';
import { TranslationRepository } from './TranslationRepository';
import { TranslationCache } from './TranslationCache';

/**
 * 🔄 Translation Sync Service
 * Purpose: Synchronization between local JSON files and the database.
 */
export class TranslationSyncService {
    /**
     * Loads local files by namespace.
     */
    static async loadFromLocalFile(locale: string): Promise<Record<string, unknown>> {
        const namespaceDir = path.join(process.cwd(), 'messages', locale);
        const merged: Record<string, unknown> = {};

        try {
            if (fs.existsSync(namespaceDir) && fs.statSync(namespaceDir).isDirectory()) {
                const nsFiles = fs.readdirSync(namespaceDir).filter(f => f.endsWith('.json'));
                for (const file of nsFiles) {
                    const ns = file.replace('.json', '');
                    const content = fs.readFileSync(path.join(namespaceDir, file), 'utf8');
                    merged[ns] = JSON.parse(content);
                }
            } else {
                const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
                if (fs.existsSync(filePath)) {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
            }
        } catch (err) {
            console.error(`[TranslationSyncService] Load error for ${locale}:`, err);
        }
        return merged;
    }

    /**
     * Synchronizes a nested object to the DB.
     */
    static async syncToDb(locale: string, messages: Record<string, unknown>, tenantId = 'platform_master') {
        const flat = I18nObjectUtils.flattenObject(messages);

        // Get keys already customized in DB to avoid overwriting them
        const dbDocs = await TranslationRepository.findMessages(locale, tenantId);
        const customizedKeys = new Set(dbDocs.filter((d: any) => d.isCustomized).map((d: any) => d.key));

        const operations = Object.entries(flat).map(([key, value]) => {
            if (!key || key.startsWith('$') || key === '$') {
                return null;
            }

            // If the key is customized, skip sync for this key
            if (customizedKeys.has(key)) {
                return null;
            }

            return {
                updateOne: {
                    filter: { key, locale, tenantId },
                    update: {
                        $set: {
                            value,
                            locale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            updatedBy: "SYSTEM_SYNC",
                            tenantId,
                            isCustomized: false
                        }
                    },
                    upsert: true
                }
            };
        }).filter(Boolean) as AnyBulkWriteOperation<Document>[];

        if (operations.length === 0) return { added: 0, updated: 0 };

        const result = await TranslationRepository.bulkUpdate(operations, tenantId);
        await TranslationCache.invalidate(locale, tenantId);

        return {
            added: (result as { upsertedCount?: number, modifiedCount?: number }).upsertedCount || 0,
            updated: (result as { upsertedCount?: number, modifiedCount?: number }).modifiedCount || 0
        };
    }

    /**
     * Exports from DB to local files.
     */
    static async exportToLocalFiles(locale: string, tenantId = 'platform_master') {
        const dbDocs = await TranslationRepository.findMessages(locale, tenantId);
        if (dbDocs.length === 0) return { exported: 0, files: [] };

        const nested = I18nObjectUtils.flatToNested(
            Object.fromEntries(dbDocs.map((d: any) => [d.key, d.value]))
        );

        const baseDir = path.join(process.cwd(), 'messages', locale);
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

        const exportedFiles: string[] = [];
        let totalKeys = 0;

        for (const [ns, content] of Object.entries(nested)) {
            const filePath = path.join(baseDir, `${ns}.json`);
            let finalContent = content;

            if (fs.existsSync(filePath)) {
                const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                finalContent = I18nObjectUtils.deepMerge(existing as Record<string, unknown>, content as Record<string, unknown>);
            }

            fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2), 'utf8');
            exportedFiles.push(`${ns}.json`);
            totalKeys += I18nObjectUtils.countLeafKeys(finalContent as Record<string, unknown>);
        }

        return { exported: totalKeys, files: exportedFiles };
    }
}
