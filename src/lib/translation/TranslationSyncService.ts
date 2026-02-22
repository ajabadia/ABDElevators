
import fs from 'fs';
import path from 'path';
import { I18nObjectUtils } from '../i18n/i18n-object-utils';
import { TranslationRepository } from './TranslationRepository';
import { TranslationCache } from './TranslationCache';

/**
 * 🔄 Translation Sync Service
 * Proposito: Sincronización entre archivos locales JSON y la base de datos.
 */
export class TranslationSyncService {
    /**
     * Carga archivos locales por namespace.
     */
    static async loadFromLocalFile(locale: string): Promise<Record<string, any>> {
        const namespaceDir = path.join(process.cwd(), 'messages', locale);
        const merged: Record<string, any> = {};

        try {
            if (fs.existsSync(namespaceDir) && fs.statSync(namespaceDir).isDirectory()) {
                const nsFiles = fs.readdirSync(namespaceDir).filter(f => f.endsWith('.json'));
                for (const file of nsFiles) {
                    const ns = file.replace('.json', '');
                    const content = fs.readFileSync(path.join(namespaceDir, file), 'utf8');
                    merged[ns] = JSON.parse(content);
                }
            } else {
                // Fallback: Archivo único
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
     * Sincroniza objeto anidado a la DB.
     */
    static async syncToDb(locale: string, messages: Record<string, any>, tenantId = 'platform_master') {
        const flat = I18nObjectUtils.flattenObject(messages);

        const operations = Object.entries(flat).map(([key, value]) => {
            if (!key) return null;
            return {
                updateOne: {
                    filter: { key, locale, tenantId },
                    update: [
                        {
                            $set: {
                                value: {
                                    $cond: {
                                        if: { $eq: ["$isCustomized", true] },
                                        then: "$value",
                                        else: value
                                    }
                                },
                                locale,
                                namespace: key.split('.')[0] || 'common',
                                isObsolete: false,
                                lastUpdated: {
                                    $cond: {
                                        if: { $eq: ["$isCustomized", true] },
                                        then: "$lastUpdated",
                                        else: new Date()
                                    }
                                },
                                updatedBy: {
                                    $cond: {
                                        if: { $eq: ["$isCustomized", true] },
                                        then: "$updatedBy",
                                        else: "SYSTEM_SYNC"
                                    }
                                },
                                tenantId,
                                isCustomized: { $ifNull: ["$isCustomized", false] }
                            }
                        }
                    ],
                    upsert: true
                }
            };
        }).filter(Boolean);

        const result = await TranslationRepository.bulkUpdate(operations, tenantId);
        await TranslationCache.invalidate(locale, tenantId);

        return {
            added: (result as any).upsertedCount || 0,
            updated: (result as any).modifiedCount || 0
        };
    }

    /**
     * Exporta de DB a archivos locales (solo recomendado para dev).
     */
    static async exportToLocalFiles(locale: string, tenantId = 'platform_master') {
        const dbDocs = await TranslationRepository.findMessages(locale, tenantId);
        if (dbDocs.length === 0) return { exported: 0, files: [] };

        const nested = I18nObjectUtils.flatToNested(
            Object.fromEntries(dbDocs.map(d => [d.key, d.value]))
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
                finalContent = I18nObjectUtils.deepMerge(existing, content);
            }

            fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2), 'utf8');
            exportedFiles.push(`${ns}.json`);
            totalKeys += I18nObjectUtils.countLeafKeys(finalContent);
        }

        return { exported: totalKeys, files: exportedFiles };
    }
}
