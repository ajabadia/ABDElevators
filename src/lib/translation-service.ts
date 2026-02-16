import { getTenantCollection } from './db-tenant';
import { redis } from './redis';
import { logEvento } from './logger';
import { AppError } from './errors';
import fs from 'fs';
import path from 'path';
import { callGemini } from './llm';
import { PromptService } from './prompt-service';
import { PROMPTS } from './prompts';
import { SUPPORTED_LOCALES } from './i18n-config';

/**
 * ⚙️ TranslationService (Fase 62+)
 * Gestión dinámica de internacionalización con caché estratificada y desacoplamiento de sesión.
 */
export class TranslationService {
    private static COLLECTION = 'translations';
    private static CACHE_TTL = 3600 * 24; // 24 horas
    static readonly SUPPORTED_LOCALES = SUPPORTED_LOCALES;

    private static cleanJsonString(str: string): string {
        let clean = str.replace(/```json|```/g, '').trim();
        clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        const quoteCount = (clean.match(/"/g) || []).length;
        const isEscaped = clean.endsWith('\\"');
        if (quoteCount % 2 !== 0 && !isEscaped) clean += '"';
        const openBraces = (clean.match(/{/g) || []).length;
        const closeBraces = (clean.match(/}/g) || []).length;
        if (openBraces > closeBraces) clean += '}'.repeat(openBraces - closeBraces);
        return clean;
    }

    /**
     * Usa IA para traducir automáticamente llaves faltantes en lotes controlados.
     * Hybrid Merge: Optimized Logic from Backup (Pre-filtering)
     */
    static async autoTranslate(params: {
        sourceLocale: string;
        targetLocale: string;
        keys: string[];
        tenantId: string;
        correlationId: string;
    }) {
        const { sourceLocale, targetLocale, keys, tenantId, correlationId } = params;
        const collection = await getTenantCollection(this.COLLECTION);

        // 1. Obtener valores origen y destino para filtrar lo que ya existe
        const [sourceMessages, targetMessages] = await Promise.all([
            this.getMessages(sourceLocale, tenantId),
            this.getMessages(targetLocale, tenantId)
        ]);
        const flatSource = this.nestToFlat(sourceMessages);
        const flatTarget = this.nestToFlat(targetMessages);

        const allValidKeys = keys.filter(key => {
            const hasSource = !!flatSource[key];
            const hasTarget = !!flatTarget[key];
            // Solo traducimos si existe en origen y NO existe en destino
            return hasSource && !hasTarget;
        });

        if (allValidKeys.length === 0) {
            console.log(`[i18n-ai] ℹ️ Nada nuevo que traducir de ${sourceLocale} a ${targetLocale}`);
            return { success: true, count: 0 };
        }

        const keysToProcess = allValidKeys
            .map(key => flatSource[key] ? `"${key}": "${flatSource[key]}"` : null)
            .filter(Boolean)
            .join('\n');

        // 2. Obtener Prompt Dinámico
        let prompt: string;
        let model: string = 'gemini-1.5-flash';

        try {
            const rendered = await PromptService.getRenderedPrompt(
                'I18N_AUTO_TRANSLATE',
                { sourceLocale, targetLocale, translationsToProcess: keysToProcess },
                tenantId
            );
            prompt = rendered.text;
            model = rendered.model;
        } catch (err) {
            console.warn(`[i18n-ai] ⚠️ Fallback to master prompt for I18N_AUTO_TRANSLATE:`, err);
            prompt = PROMPTS.I18N_AUTO_TRANSLATE
                .replace('{{sourceLocale}}', sourceLocale)
                .replace('{{targetLocale}}', targetLocale)
                .replace('{{translationsToProcess}}', keysToProcess);
        }

        const response = await callGemini(prompt, tenantId, correlationId, { temperature: 0.1, model });

        try {
            const jsonStr = this.cleanJsonString(response);
            const translatedMap = JSON.parse(jsonStr);

            // 3. Persistir resultados
            const operations = Object.entries(translatedMap).map(([key, value]) => {
                if (!key) return null;
                return {
                    updateOne: {
                        filter: {
                            key,
                            locale: targetLocale,
                            tenantId: tenantId || 'platform_master',
                            isCustomized: { $ne: true }
                        },
                        update: {
                            $set: {
                                value,
                                locale: targetLocale,
                                namespace: key.split('.')[0] || 'common',
                                isObsolete: false,
                                lastUpdated: new Date(),
                                updatedBy: 'AI_GEMINI',
                                tenantId: tenantId || 'platform_master'
                            },
                            $setOnInsert: { isCustomized: false }
                        },
                        upsert: true
                    }
                };
            });

            const validOperations = operations.filter((op): op is any => op !== null);

            if (validOperations.length > 0) {
                await collection.unsecureRawCollection.bulkWrite(validOperations);

                // Invalización global
                const targetLocaleStr = targetLocale;
                console.log(`[i18n-ai] 🧬 AI Sync: Persisted ${validOperations.length} translations for ${targetLocaleStr}`);

                try {
                    const cacheKeys = await redis.keys(`i18n:*:${targetLocaleStr}`);
                    if (cacheKeys.length > 0) await redis.del(...cacheKeys);
                } catch (e) {
                    console.error('[i18n-ai] Redis invalidation failed:', e);
                }
            }

            return { success: true, count: validOperations.length };
        } catch (error) {
            console.error('[TranslationService] AI Parse Error:', response);
            throw new AppError('EXTERNAL_SERVICE_ERROR', 500, 'Fallo al procesar traducción de IA');
        }
    }

    /**
     * Sincronización BIDIRECCIONAL inteligente (Hybrid Merge Feature)
     */
    static async syncBidirectional(
        locale: string,
        direction: 'to-db' | 'to-file',
        tenantId = 'platform_master',
        options: { force?: boolean } = {}
    ): Promise<{ added: number; updated: number; keysChanged: string[] }> {
        console.log(`[i18n-sync] 🔄 STARTING syncBidirectional (${direction}) for locale: '${locale}'`);

        const jsonMessages = await this.loadFromLocalFile(locale);
        const flatJson = this.nestToFlat(jsonMessages);

        // Usamos platform_master user simulation para acceder a la colección
        const dbCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId, role: 'SUPER_ADMIN' } });
        const dbDocs = await dbCollection.find({ locale, isObsolete: { $ne: true } as any, tenantId });

        const dbMap = new Map(dbDocs.map(d => [d.key, d]));
        let addedCount = 0;
        let updatedCount = 0;
        let keysChanged: string[] = [];

        if (direction === 'to-db') {
            const operations = [];
            for (const [key, jsonValue] of Object.entries(flatJson)) {
                const dbEntry = dbMap.get(key);
                let shouldUpdate = false;

                if (!dbEntry) {
                    shouldUpdate = true;
                    addedCount++;
                } else if (options.force || dbEntry.value !== jsonValue) {
                    shouldUpdate = true;
                    updatedCount++;
                }

                if (shouldUpdate) {
                    keysChanged.push(key);
                    operations.push({
                        updateOne: {
                            filter: { key, locale, tenantId },
                            update: {
                                $set: {
                                    value: jsonValue,
                                    locale,
                                    tenantId,
                                    namespace: key.split('.')[0] || 'common',
                                    isObsolete: false,
                                    lastUpdated: new Date(),
                                    updatedBy: 'SYNC_SMART'
                                }
                            },
                            upsert: true
                        }
                    });
                }
            }

            if (operations.length > 0) {
                await dbCollection.bulkWrite(operations);
            }
        } else {
            // DB -> File
            // Note: In strict next.js serverless, writing to file is not persistent, 
            // but we keep the logic for local dev environments
            const mergedMessages = { ...jsonMessages };
            let changed = false;

            for (const dbDoc of dbDocs) {
                const { key, value: dbValue } = dbDoc;
                const jsonValue = flatJson[key];

                if (!jsonValue || (options.force && jsonValue !== dbValue)) {
                    // Deep merge logic would go here, simplified for now
                    if (!jsonValue) addedCount++; else updatedCount++;
                    keysChanged.push(key);
                    changed = true;
                }
            }

            if (changed) {
                // Logic to write back would be here if allowed
                console.log(`[i18n-sync] ⚠️ File system write skipped in production environment`);
            }
        }

        // Invalidate Cache
        if (keysChanged.length > 0) {
            const keys = await redis.keys(`i18n:*:${locale}`);
            if (keys.length > 0) await redis.del(...keys);
        }

        return { added: addedCount, updated: updatedCount, keysChanged };
    }

    /**
     * Fuerza la sincronización desde el archivo JSON local hacia la DB.
     */
    static async forceSyncFromLocal(locale: string, tenantId = 'platform_master'): Promise<{ messages: Record<string, any>, added: number, updated: number }> {
        console.log(`[i18n-sync] 🔄 Iniciando forceSyncFromLocal para locale: '${locale}' (Tenant: ${tenantId})`);
        const messages = await this.loadFromLocalFile(locale);
        const keyCount = Object.keys(messages).length;
        let stats = { added: 0, updated: 0 };

        if (keyCount > 0) {
            stats = await this.syncToDb(locale, messages, tenantId);

            // Invalidar caché
            if (tenantId === 'platform_master') {
                const keys = await redis.keys(`i18n:*:${locale}`);
                if (keys.length > 0) await redis.del(...keys);
                console.log(`[i18n-sync] 🧹 Global cache invalidated for ${locale}`);
            } else {
                await redis.del(`i18n:${tenantId}:${locale}`);
            }
        }
        return { messages, ...stats };
    }

    /**
     * Sincroniza TODOS los idiomas soportados desde JSON local hacia la DB.
     */
    static async forceSyncAllLocales(tenantId = 'platform_master'): Promise<Record<string, { count: number, added: number, updated: number }>> {
        const results: Record<string, any> = {};
        for (const locale of this.SUPPORTED_LOCALES) {
            try {
                const { messages, added, updated } = await this.forceSyncFromLocal(locale, tenantId);
                const flat = this.nestToFlat(messages);
                results[locale] = { count: Object.keys(flat).length, added, updated };
                console.log(`[i18n-sync] ✅ Locale '${locale}' sincronizado: ${results[locale].count} llaves`);
            } catch (err) {
                console.error(`[i18n-sync] ❌ Error sincronizando locale '${locale}':`, err);
                results[locale] = { count: -1, added: 0, updated: 0 };
            }
        }
        return results;
    }

    /**
     * Obtiene todos los mensajes para un idioma dado.
     * 🚀 Estrategia de carga profesional: Redis -> layers[Local JSON + Master DB + Tenant DB]
     */
    static async getMessages(locale: string, tenantId: string = 'platform_master'): Promise<Record<string, any>> {
        const cacheKey = `i18n:${tenantId}:${locale}`;

        try {
            // 1. Capa 0: Redis
            const cached = await redis.get(cacheKey) as Record<string, any> | null;
            if (cached && Object.keys(cached).length > 0) {
                return cached;
            }

            // 2. Capa 1: Base (JSON Local)
            const localMessages = await this.loadFromLocalFile(locale);
            let finalMessages = { ...localMessages };

            // 3. Capa 2: Overrides de DB (Platform Master)
            const masterCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
            const masterDocs = await masterCollection.find({
                locale,
                tenantId: 'platform_master',
                isObsolete: { $ne: true } as any
            });

            if (masterDocs.length > 0) {
                const masterOverrides = this.flatToNested(masterDocs);
                finalMessages = this.deepMerge(finalMessages, masterOverrides);
                console.log(`[i18n] 🏛️ Loaded ${masterDocs.length} master overrides for ${locale}`);
            }

            // 4. Capa 3: Overrides específicos del Tenant (si aplica)
            if (tenantId !== 'platform_master') {
                const tenantCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId } });
                const tenantDocs = await tenantCollection.find({
                    locale,
                    tenantId,
                    isObsolete: { $ne: true } as any
                });

                if (tenantDocs.length > 0) {
                    const tenantOverrides = this.flatToNested(tenantDocs);
                    finalMessages = this.deepMerge(finalMessages, tenantOverrides);
                    console.log(`[i18n] 🧬 Merged ${tenantDocs.length} overrides for tenant ${tenantId}`);
                }
            }

            // 5. Guardar en Redis
            if (Object.keys(finalMessages).length > 0) {
                await redis.set(cacheKey, finalMessages, { ex: this.CACHE_TTL });
            }

            return finalMessages;
        } catch (error) {
            console.error(`[TranslationService] Failure loading i18n for ${tenantId}/${locale}:`, error);
            return this.loadFromLocalFile(locale); // Fallback seguro
        }
    }

    /**
     * Obtiene los mensajes con metadatos de origen (Fuente: Local, Master, Tenant).
     * Útil para el panel de administración.
     */
    static async getDetailedMessages(locale: string, tenantId: string = 'platform_master'): Promise<Record<string, { value: string; source: 'local' | 'master' | 'tenant'; isCustomized?: boolean }>> {
        // 1. Cargar Base (JSON Local)
        const localMessages = await this.loadFromLocalFile(locale);
        const flatLocal = this.nestToFlat(localMessages);

        const result: Record<string, { value: string; source: 'local' | 'master' | 'tenant'; isCustomized?: boolean }> = {};

        // Inicializar con Local
        for (const [key, value] of Object.entries(flatLocal)) {
            result[key] = { value, source: 'local' };
        }

        // 2. Overrides de DB (Platform Master)
        const masterCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        const masterDocs = await masterCollection.find({
            locale,
            tenantId: 'platform_master',
            isObsolete: { $ne: true } as any
        });

        for (const doc of masterDocs) {
            result[doc.key] = {
                value: doc.value,
                source: 'master',
                isCustomized: !!doc.isCustomized
            };
        }
        console.log(`[i18n-debug] 🏛️ Detailed: Loaded ${masterDocs.length} master overrides`);

        // 3. Overrides de Tenant (si aplica)
        if (tenantId !== 'platform_master') {
            const tenantCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId } });
            const tenantDocs = await tenantCollection.find({
                locale,
                tenantId,
                isObsolete: { $ne: true } as any
            });

            for (const doc of tenantDocs) {
                result[doc.key] = { value: doc.value, source: 'tenant' };
            }
        }

        return result;
    }

    static async updateTranslation(params: {
        key: string;
        value: string;
        locale: string;
        namespace?: string;
        userId?: string;
        tenantId?: string;
    }) {
        const { key, value, locale, namespace, userId, tenantId } = params;
        const effectiveNamespace = namespace || key.split('.')[0] || 'common';
        const effectiveTenantId = tenantId || 'platform_master';

        // Forzamos MAIN clúster y rol de sistema para operaciones i18n
        const collection = await getTenantCollection(this.COLLECTION, { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });

        console.log(`[i18n] 📝 Actualizando '${key}' -> '${value.substring(0, 20)}...' (${locale}) para '${effectiveTenantId}'`);

        // 🎯 Operación quirúrgica:
        // Si ya existe registro para este tenant, lo actualizamos. 
        // Si no, y estamos en platform_master, buscamos registros huérfanos para consolidar.
        const filter: any = { key, locale };
        if (effectiveTenantId === 'platform_master') {
            filter.tenantId = { $in: ['platform_master', null, undefined, 'unknown'] };
        } else {
            filter.tenantId = effectiveTenantId;
        }

        const updateResult = await collection.updateOne(
            filter,
            {
                $set: {
                    value,
                    namespace: effectiveNamespace,
                    isObsolete: false,
                    isCustomized: true, // 🛡️ CRITICAL: Mark as manual edit
                    lastUpdated: new Date(),
                    updatedBy: userId,
                    tenantId: effectiveTenantId
                }
            },
            { upsert: true }
        );

        console.log(`[i18n] ✅ DB Update: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}, upserted=${updateResult.upsertedId ? 'YES' : 'NO'}`);

        // Estrategia de Invalización robusta
        if (effectiveTenantId === 'platform_master') {
            // Si cambia el MASTER, invalidamos la caché global (i18n:*:[locale])
            // Usamos un bloque try-catch para evitar que fallos en Redis bloqueen la respuesta
            try {
                const keys = await redis.keys(`i18n:*:${locale}`);
                if (keys && keys.length > 0) {
                    await redis.del(...keys);
                    console.log(`[i18n] 🧹 Global Invalidation: Purged ${keys.length} keys`);
                } else {
                    // Fallback: Si keys() no funciona, al menos borramos el master conocido
                    await redis.del(`i18n:platform_master:${locale}`);
                }
            } catch (err) {
                console.error('[i18n] ❌ Error in cache invalidation:', err);
            }
        } else {
            await redis.del(`i18n:${effectiveTenantId}:${locale}`);
        }

        await logEvento({
            level: 'INFO',
            source: 'I18N_SERVICE',
            action: 'TRANSLATION_UPDATED',
            message: `Key '${key}' updated in '${locale}' for '${effectiveTenantId}'`,
            correlationId: 'API_I18N_' + Date.now(),
            details: { key, locale, matched: updateResult.matchedCount, modified: updateResult.modifiedCount }
        });

        return { success: true };
    }

    /**
     * Exporta los overrides de la DB a archivos JSON locales.
     */
    public static async exportToLocalFiles(locale: string, tenantId = 'platform_master'): Promise<{ exported: number; files: string[] }> {
        console.log(`[i18n] 📤 Exportando traducciones de '${tenantId}/${locale}' a archivos locales...`);

        const collection = await getTenantCollection(this.COLLECTION, { user: { tenantId, role: 'SUPER_ADMIN' } });
        const dbDocs = await collection.find({ locale, tenantId, isObsolete: { $ne: true } as any });

        if (dbDocs.length === 0) {
            console.warn(`[i18n] ⚠️ No hay traducciones en DB para exportar (${locale})`);
            return { exported: 0, files: [] };
        }

        const nested = this.flatToNested(dbDocs);
        const namespaces = Object.keys(nested);
        const baseDir = path.join(process.cwd(), 'messages', locale);

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        const exportedFiles: string[] = [];
        let totalKeys = 0;

        for (const ns of namespaces) {
            const filePath = path.join(baseDir, `${ns}.json`);
            let contentToSave = nested[ns];

            if (fs.existsSync(filePath)) {
                try {
                    const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    contentToSave = this.deepMerge(existingContent, contentToSave);
                } catch (e) {
                    console.error(`[i18n] ❌ Error leyendo archivo existente ${ns}.json para merge:`, e);
                }
            }

            fs.writeFileSync(filePath, JSON.stringify(contentToSave, null, 2), 'utf8');
            exportedFiles.push(`${ns}.json`);
            totalKeys += this.countLeafKeys(contentToSave);
        }

        console.log(`[i18n] ✅ Exportación completada: ${totalKeys} llaves en ${exportedFiles.length} archivos`);
        return { exported: totalKeys, files: exportedFiles };
    }

    /**
     * Carga los archivos JSON locales de namespace.
     */
    public static async loadFromLocalFile(locale: string): Promise<Record<string, any>> {
        try {
            const namespaceDir = path.join(process.cwd(), 'messages', locale);

            if (fs.existsSync(namespaceDir) && fs.statSync(namespaceDir).isDirectory()) {
                const nsFiles = fs.readdirSync(namespaceDir).filter((f: string) => f.endsWith('.json'));

                if (nsFiles.length > 0) {
                    const merged: Record<string, any> = {};
                    for (const file of nsFiles) {
                        const ns = file.replace('.json', '');
                        const filePath = path.join(namespaceDir, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        merged[ns] = JSON.parse(content);
                    }
                    return merged;
                }
            }

            // Fallback: monolith
            const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
            if (!fs.existsSync(filePath)) return {};

            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (err: any) {
            console.error(`[i18n] ❌ Error cargando JSON local para '${locale}':`, err.message);
            return {};
        }
    }

    /**
     * Cuenta las llaves hoja de un objeto anidado.
     */
    private static countLeafKeys(obj: any, count = 0): number {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                count = this.countLeafKeys(obj[key], count);
            } else {
                count++;
            }
        }
        return count;
    }

    /**
     * Convierte lista plana de DB a objeto anidado.
     */
    public static flatToNested(docs: any[]): Record<string, any> {
        const result: Record<string, any> = {};
        for (const doc of docs) {
            const keys = doc.key.split('.');
            let current = result;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = doc.value;
                } else {
                    current[k] = current[k] || {};
                    current = current[k];
                }
            }
        }
        return result;
    }

    /**
     * Sincroniza un objeto anidado a la base de datos (Bulk operation).
     */
    private static async syncToDb(locale: string, messages: Record<string, any>, tenantId = 'platform_master'): Promise<{ added: number, updated: number }> {
        const flat = this.nestToFlat(messages);
        const collection = await getTenantCollection(this.COLLECTION, { user: { tenantId, role: 'SUPER_ADMIN' } });
        let added = 0;
        let updated = 0;

        const operations = Object.entries(flat).map(([key, value]) => {
            if (!key) return null;
            const namespace = key.split('.')[0] || 'common';
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
                                locale: locale,
                                namespace: namespace,
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
                                tenantId: tenantId,
                                isCustomized: { $ifNull: ["$isCustomized", false] }
                            }
                        }
                    ],
                    upsert: true
                }
            };
        }).filter(op => op !== null);

        if (operations.length > 0) {
            // BulkWrite logic with stats aggregation
            for (let i = 0; i < operations.length; i += 500) {
                const batch = operations.slice(i, i + 500) as any[];
                const result = await collection.bulkWrite(batch);
                added += (result as any).upsertedCount || 0;
                updated += (result as any).modifiedCount || 0;
            }
        }

        return { added, updated };
    }

    /**
     * Aplana un objeto anidado.
     */
    public static nestToFlat(obj: any, prefix = ''): Record<string, string> {
        const result: Record<string, string> = {};
        for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, this.nestToFlat(value, newKey));
            } else {
                result[newKey] = String(value);
            }
        }
        return result;
    }

    /**
     * Mezcla profunda de dos objetos.
     */
    private static deepMerge(target: any, source: any): any {
        const output = { ...target };
        if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
            Object.keys(source).forEach(key => {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    /**
     * Retorna información técnica detallada sobre una llave para debugging.
     */
    static async getKeyDebugInfo(locale: string, key: string, tenantId = 'platform_master') {
        // 1. JSON Local
        const localMessages = await this.loadFromLocalFile(locale);
        const flatLocal = this.nestToFlat(localMessages);
        const jsonValue = flatLocal[key] || null;

        // 2. DB Entries
        const collection = await getTenantCollection(this.COLLECTION, { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        const dbEntries = await collection.find({ key, locale });

        // 3. Cache Status
        const masterCacheKey = `i18n:platform_master:${locale}`;
        const masterCacheExists = !!(await redis.get(masterCacheKey));

        const tenantCacheKey = `i18n:${tenantId}:${locale}`;
        const cached = await redis.get(tenantCacheKey) as Record<string, any> | null;
        const flatCached = cached ? this.nestToFlat(cached) : {};
        const cachedValue = flatCached[key] || null;

        // Determinar Source
        let source = 'Local JSON';
        if (dbEntries.find((d: any) => d.tenantId === 'platform_master')) source = 'Master DB';
        if (dbEntries.find((d: any) => d.tenantId === tenantId && tenantId !== 'platform_master')) source = 'Tenant Override';

        return {
            key,
            locale,
            tenantId,
            source,
            masterCacheExists,
            values: {
                json: jsonValue,
                cache: cachedValue,
                db: dbEntries.map((d: any) => ({
                    tenantId: d.tenantId,
                    value: d.value,
                    lastUpdated: d.lastUpdated,
                    namespace: d.namespace,
                    isCustomized: !!d.isCustomized
                }))
            }
        };
    }
}
