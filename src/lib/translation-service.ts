import { getTenantCollection } from './db-tenant';
import { redis } from './redis';
import { Translation, TranslationSchema } from './schemas';
import { logEvento } from './logger';
import { AppError } from './errors';
import fs from 'fs';
import path from 'path';
import { callGemini } from './llm';
import { PromptService } from './prompt-service';
import { PROMPTS } from './prompts';

/**
 * ⚙️ TranslationService (Fase 62)
 * Gestión dinámica de internacionalización con caché estratificada.
 */
export class TranslationService {
    private static COLLECTION = 'translations';
    private static CACHE_TTL = 3600 * 24; // 24 horas

    /**
     * Limpia y normaliza strings JSON provenientes de LLMs
     */
    private static cleanJsonString(str: string): string {
        let clean = str.replace(/```json|```/g, '').trim();

        // Eliminar comas trailing en objetos/arrays
        clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        // Heurística para cerrar strings truncados
        const quoteCount = (clean.match(/"/g) || []).length;
        const isEscaped = clean.endsWith('\\"');
        if (quoteCount % 2 !== 0 && !isEscaped) {
            clean += '"';
        }

        // Heurística para cerrar llaves/corchetes
        const openBraces = (clean.match(/{/g) || []).length;
        const closeBraces = (clean.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
            clean += '}'.repeat(openBraces - closeBraces);
        }

        return clean;
    }

    /**
     * Usa IA para traducir automáticamente llaves faltantes.
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
            this.getMessages(sourceLocale),
            this.getMessages(targetLocale)
        ]);
        const flatSource = this.nestToFlat(sourceMessages);
        const flatTarget = this.nestToFlat(targetMessages);

        const keysToProcess = keys
            .filter(key => {
                const hasSource = !!flatSource[key];
                const hasTarget = !!flatTarget[key];
                if (!hasSource) console.log(`[i18n-ai] ⚠️ Saltando '${key}': No existe en origen (${sourceLocale})`);
                if (hasTarget) console.log(`[i18n-ai] ℹ️ Saltando '${key}': Ya existe en destino (${targetLocale})`);
                return hasSource && !hasTarget;
            })
            .map(key => `"${key}": "${flatSource[key]}"`)
            .join('\n');

        if (!keysToProcess) {
            console.log(`[i18n-ai] ℹ️ Nada nuevo que traducir de ${sourceLocale} a ${targetLocale}`);
            return { success: true, count: 0 };
        }

        // 2. Obtener Prompt Dinámico (Fase standard del proyecto)
        let prompt: string;
        let model: string = 'gemini-2.5-flash';

        try {
            const rendered = await PromptService.getRenderedPrompt(
                'I18N_AUTO_TRANSLATE',
                { sourceLocale, targetLocale, translationsToProcess: keysToProcess, vertical: 'Elevators & Technical Intelligence' },
                tenantId
            );
            prompt = rendered.text;
            model = rendered.model;
        } catch (err) {
            console.warn(`[i18n-ai] ⚠️ Fallback to master prompt for I18N_AUTO_TRANSLATE:`, err);
            prompt = PROMPTS.I18N_AUTO_TRANSLATE
                .replace(/{{sourceLocale}}/g, sourceLocale)
                .replace(/{{targetLocale}}/g, targetLocale)
                .replace(/{{translationsToProcess}}/g, keysToProcess) // Use keysToProcess variable
                .replace(/{{vertical}}/g, 'Elevators & Technical Intelligence');
        }

        const response = await callGemini(prompt, tenantId, correlationId, { temperature: 0.1, model });

        try {
            // Limpiar posible markdown y errores comunes de JSON
            const jsonStr = this.cleanJsonString(response);
            const translatedMap = JSON.parse(jsonStr);

            // 3. Persistir resultados con tenantId para evitar registros huérfanos
            const operations = Object.entries(translatedMap).map(([key, value]) => ({
                updateOne: {
                    filter: { key, locale: targetLocale, tenantId },
                    update: {
                        $set: {
                            value,
                            locale: targetLocale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            updatedBy: 'AI_GEMINI',
                            tenantId // 🚨 CRÍTICO: Asegurar persistencia del tenant
                        }
                    },
                    upsert: true
                }
            }));

            if (operations.length > 0) {
                await collection.bulkWrite(operations);

                // Invalidación de caché global y por tenant
                const keysToDel = await redis.keys(`i18n:*:${targetLocale}`);
                if (keysToDel.length > 0) {
                    await redis.del(...keysToDel);
                }
            }

            return { success: true, count: operations.length };
        } catch (error: any) {
            console.error('[TranslationService] AI Parse Error:', error);
            console.error('[TranslationService] Raw Response was:', response);
            throw new AppError('EXTERNAL_SERVICE_ERROR', 500, `Fallo al procesar traducción de IA: ${error.message}`);
        }
    }

    /**
     * Sincronización BIDIRECCIONAL inteligente:
     * - direction: 'to-db' → Merge: añade/actualiza claves del JSON a la BD
     * - direction: 'to-file' → Merge: añade/actualiza claves de la BD al JSON
     * - options.force: fuerza la sobreescritura incluso si no hay discrepancia detectada (útil para reparaciones)
     */
    static async syncBidirectional(
        locale: string,
        direction: 'to-db' | 'to-file',
        tenantId = 'platform_master',
        options: { force?: boolean } = {}
    ): Promise<{ added: number; updated: number; keysChanged: string[] }> {
        console.log(`[i18n-sync] 🔄 STARTING syncBidirectional (${direction}) for locale: '${locale}'`);

        try {
            const jsonMessages = await this.loadFromLocalFile(locale);
            console.log(`[i18n-sync] 📄 Local file loaded: ${Object.keys(jsonMessages).length} root keys`);

            const dbCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId, role: 'USER' } });
            console.log(`[i18n-sync] 🛡️ Collection obtained for tenant: ${tenantId}`);

            const dbDocs = await dbCollection.find({ locale, isObsolete: false, tenantId });
            console.log(`[i18n-sync] 📦 DB docs fetched: ${dbDocs.length} items`);

            const flatJson = this.nestToFlat(jsonMessages);
            console.log(`[i18n-sync] 🧱 Flattened JSON: ${Object.keys(flatJson).length} keys`);

            // Mapear docs de BD para fácil acceso a metadata
            const dbMap = new Map(dbDocs.map(d => [d.key, d]));
            console.log(`[i18n-sync] 🗺️ DB Map created: ${dbMap.size} entries`);

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
                    console.log(`[i18n-sync] 💾 Executing bulkWrite: ${operations.length} operations...`);
                    for (let i = 0; i < operations.length; i += 500) {
                        const batch = operations.slice(i, i + 500) as any[];
                        console.log(`[i18n-sync] 📤 Sending batch ${i / 500 + 1}...`);
                        await dbCollection.bulkWrite(batch);
                        console.log(`[i18n-sync] ✅ Batch ${i / 500 + 1} done.`);
                    }
                }
            } else {
                // DB → JSON
                const mergedMessages = { ...jsonMessages };
                let changed = false;

                for (const dbDoc of dbDocs) {
                    const { key, value: dbValue } = dbDoc;
                    const jsonValue = flatJson[key];

                    if (!jsonValue || (options.force && jsonValue !== dbValue)) {
                        const parts = key.split('.');
                        let current = mergedMessages;
                        for (let i = 0; i < parts.length - 1; i++) {
                            if (!current[parts[i]]) current[parts[i]] = {};
                            current = current[parts[i]];
                        }
                        current[parts[parts.length - 1]] = dbValue;

                        if (!jsonValue) addedCount++; else updatedCount++;
                        keysChanged.push(key);
                        changed = true;
                    }
                }

                if (changed) {
                    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
                    console.log(`[i18n-sync] ✍️ Writing local file: ${filePath}`);
                    fs.writeFileSync(filePath, JSON.stringify(mergedMessages, null, 4), 'utf8');
                    console.log(`[i18n-sync] ✅ Local file updated.`);
                }
            }

            // Invalidar caché
            console.log(`[i18n-sync] 🧹 Invalidating cache for tenant: ${tenantId}...`);
            const pattern = tenantId === 'platform_master' ? 'i18n:*' : `i18n:*:${locale}`;
            const cacheKeys = await redis.keys(pattern).catch((e: unknown) => {
                const message = e instanceof Error ? e.message : String(e);
                console.warn(`[i18n-sync] ⚠️ Redis error fetching keys: ${message}`);
                return [];
            });

            if (cacheKeys.length > 0) {
                await redis.del(...cacheKeys).catch((e: unknown) => {
                    const message = e instanceof Error ? e.message : String(e);
                    console.warn(`[i18n-sync] ⚠️ Redis error deleting keys: ${message}`);
                });
                console.log(`[i18n-sync] 🧹 Cache invalidated: ${pattern} (${cacheKeys.length} items)`);
            }

            console.log(`[i18n-sync] 🏁 Completed: ${addedCount} added, ${updatedCount} updated.`);
            return { added: addedCount, updated: updatedCount, keysChanged };
        } catch (err: any) {
            console.error(`[i18n-sync] ❌ FATAL ERROR in syncBidirectional:`, err);
            throw err; // Re-throw to be caught by route handler
        }
    }

    /**
     * Fuerza la sincronización desde el archivo JSON local hacia la DB.
     * @deprecated Usar syncBidirectional con direction='to-db' para merge inteligente
     */
    static async forceSyncFromLocal(locale: string, tenantId = 'platform_master'): Promise<Record<string, any>> {
        console.log(`[i18n-sync] 🔄 Iniciando forceSyncFromLocal para locale: '${locale}' (Tenant: ${tenantId})`);
        const messages = await this.loadFromLocalFile(locale);
        const keyCount = Object.keys(messages).length;

        if (keyCount > 0) {
            await this.syncToDb(locale, messages, tenantId);

            // Invalidar caché (Usamos la misma lógica que updateTranslation para coherencia)
            if (tenantId === 'platform_master') {
                const keys = await redis.keys(`i18n:*:${locale}`);
                if (keys.length > 0) await redis.del(...keys);
                console.log(`[i18n-sync] 🧹 Global cache invalidated for ${locale}`);
            } else {
                await redis.del(`i18n:${tenantId}:${locale}`);
            }
        }
        return messages;
    }

    /**
     * Obtiene todos los mensajes para un idioma.
     * Estrategia de Capas (Phase 63): Tenant Overrides > Platform Master > JSON Local
     */
    static async getMessages(locale: string, tenantId?: string): Promise<Record<string, any>> {
        // 1. Identificar Tenant Context con fallback robusto
        let effectiveTenantId = tenantId;
        if (!effectiveTenantId || effectiveTenantId === 'unknown') {
            try {
                const { auth } = await import('./auth');
                const session = await auth();
                effectiveTenantId = session?.user?.tenantId || 'platform_master';
            } catch {
                effectiveTenantId = 'platform_master';
            }
        }

        const cacheKey = `i18n:${effectiveTenantId}:${locale}`;

        try {
            // 2. Intentar Cache (Redis) - Resiliencia: si falla Redis, seguimos con DB/Archivos
            try {
                const cached = await redis.get(cacheKey) as Record<string, any>;
                if (cached) return cached;
            } catch (redisError) {
                console.warn(`[i18n-cache] ⚠️ Redis unreachable for key: ${cacheKey}. Falling back to DB/Files.`, redisError);
            }

            // 3. Cargar BASE desde archivos locales (Siempre se carga como fallback base)
            let finalMessages = await this.loadFromLocalFile(locale);

            // 4. Aplicar Overrides de MASTER (Platform Master)
            const masterCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
            // 🚨 CRÍTICO: Filtrar explícitamente por tenantId: 'platform_master' para evitar colisiones con otros tenants
            const masterDocs = await masterCollection.find({ locale, isObsolete: false, tenantId: 'platform_master' });

            if (masterDocs.length > 0) {
                const masterDbMessages = this.flatToNested(masterDocs);
                finalMessages = this.deepMerge(finalMessages, masterDbMessages);
            } else {
                // Si Master está vacío en DB, sincronizamos el archivo local a la DB para futuras ediciones
                if (Object.keys(finalMessages).length > 0) {
                    this.syncToDb(locale, finalMessages, 'platform_master').catch(() => { });
                }
            }

            // 5. Cargar TENANT OVERRIDES (Si aplica)
            if (effectiveTenantId !== 'platform_master') {
                const tenantCollection = await getTenantCollection(this.COLLECTION, { user: { tenantId: effectiveTenantId, role: 'USER' } });
                const tenantDocs = await tenantCollection.find({ locale, isObsolete: false, tenantId: effectiveTenantId });

                if (tenantDocs.length > 0) {
                    const tenantMessages = this.flatToNested(tenantDocs);
                    // Merge profundo (Tenant sobreescribe Master)
                    finalMessages = this.deepMerge(finalMessages, tenantMessages);
                    console.log(`[i18n] 🧬 Merged ${tenantDocs.length} overrides for tenant ${effectiveTenantId}`);
                }
            }

            // 5. Guardar en Redis (con resiliencia al límite de Upstash)
            if (Object.keys(finalMessages).length > 0) {
                console.log(`[i18n-debug] Root keys for ${locale}:`, Object.keys(finalMessages).join(', '));
                await redis.set(cacheKey, finalMessages, { ex: this.CACHE_TTL }).catch((e: Error) => {
                    console.warn(`[i18n-cache] ⚠️ Redis Set failed (likely limit exceeded or connection error):`, e.message);
                });
            }

            return finalMessages;
        } catch (error) {
            console.error(`[TranslationService] Failure loading i18n for ${effectiveTenantId}/${locale}:`, error);
            return this.loadFromLocalFile(locale);
        }
    }

    /**
     * Actualiza o crea una traducción.
     */
    static async updateTranslation(params: {
        key: string;
        value: string;
        locale: string;
        namespace?: string;
        userId?: string;
        tenantId?: string;
    }) {
        const { key, value, locale, namespace = 'common', userId, tenantId = 'platform_master' } = params;

        // 🛠️ Auditoría 015: Uso de SecureCollection para aislamiento
        const effectiveSession = { user: { tenantId, role: 'SUPER_ADMIN' } };
        const collection = await getTenantCollection(this.COLLECTION, effectiveSession, 'MAIN', { softDeletes: false });
        const effectiveTenantId = tenantId;

        await collection.updateOne(
            { key, locale },
            {
                $set: {
                    value,
                    namespace,
                    isObsolete: false,
                    lastUpdated: new Date(),
                    updatedBy: userId,
                    tenantId: effectiveTenantId
                }
            },
            { upsert: true }
        );

        // Invalidar caché en Redis
        if (effectiveTenantId === 'platform_master') {
            // Si es global, invalidamos para todos (estrategia conservadora)
            const keys = await redis.keys(`i18n:*:${locale}`);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            console.log(`[i18n] 🧹 Validated GLOBAL cache for ${locale} (${keys.length} keys)`);
        } else {
            // Si es de tenant, solo invalidamos ese tenant
            await redis.del(`i18n:${effectiveTenantId}:${locale}`);
            console.log(`[i18n] 🧹 Validated TENANT cache for ${effectiveTenantId}:${locale}`);
        }

        await logEvento({
            level: 'INFO',
            source: 'I18N_SERVICE',
            action: 'TRANSLATION_UPDATED',
            message: `Llave '${key}' actualizada en '${locale}'`,
            correlationId: 'API_I18N_' + Date.now(),
            details: { key, locale, namespace }
        });

        return { success: true };
    }

    /**
     * Carga el archivo JSON local como fallback.
     */
    private static async loadFromLocalFile(locale: string): Promise<Record<string, any>> {
        try {
            const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
            console.log(`[i18n] 📂 Intentando leer archivo local: ${filePath}`);

            if (!fs.existsSync(filePath)) {
                console.warn(`[i18n] ⚠️ Archivo no encontrado: ${filePath}`);
                return {};
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            console.log(`[i18n] ✅ Archivo cargado satisfactoriamente (${Object.keys(data).length} llaves raíz)`);
            return data;
        } catch (err: any) {
            console.error(`[i18n] ❌ Error cargando JSON local para '${locale}':`, err.message);
            return {};
        }
    }

    /**
     * Convierte lista plana de DB a objeto anidado (next-intl format).
     */
    private static flatToNested(docs: any[]): Record<string, any> {
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
     * Sincroniza recursivamente un objeto anidado a la base de datos (Bulk operation).
     */
    private static async syncToDb(locale: string, messages: Record<string, any>, tenantId = 'platform_master') {
        const flat = this.nestToFlat(messages);
        const collection = await getTenantCollection(this.COLLECTION, { user: { tenantId } });

        const operations = Object.entries(flat).map(([key, value]) => {
            if (!key || key === '') return null;
            return {
                updateOne: {
                    filter: { key, locale, tenantId },
                    update: {
                        $set: {
                            value,
                            locale,
                            tenantId, // Ensure tenantId is persisted for isolation
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date()
                        }
                    },
                    upsert: true
                }
            };
        }).filter(op => op !== null);

        if (operations.length > 0) {
            console.log(`[i18n] 💾 MongoDB BulkWrite: ${operations.length} operaciones para '${locale}'`);
            // Fragmentar en lotes de 500 para evitar límites de MongoDB
            for (let i = 0; i < operations.length; i += 500) {
                const batch = operations.slice(i, i + 500) as any[];
                await collection.bulkWrite(batch);
            }
            console.log(`[i18n] ✅ MongoDB BulkWrite finalizado para '${locale}'`);

            // 🧹 Phase 64: Invalidar caché para que la UI se actualice
            // Si es plataforma_master, invalidamos TODO porque puede afectar a todos los tenants
            const pattern = tenantId === 'platform_master' ? 'i18n:*' : `i18n:*:${locale}`;
            const cacheKeys = await redis.keys(pattern);
            if (cacheKeys.length > 0) {
                await redis.del(...cacheKeys);
                console.log(`[i18n] 🧹 Caché invalidada con patrón '${pattern}' (${cacheKeys.length} entradas)`);
            }
        }
    }

    /**
     * Exporta traducciones desde la BD hacia el archivo JSON local (merge inteligente).
     * Añade claves de BD que no existen en JSON, sin borrar las existentes.
     * @deprecated Usar syncBidirectional con direction='to-file' para merge inteligente
     */
    static async exportToLocalFile(locale: string, tenantId = 'platform_master'): Promise<Record<string, any>> {
        const result = await this.syncBidirectional(locale, 'to-file', tenantId);
        const jsonMessages = await this.loadFromLocalFile(locale);
        return jsonMessages;
    }

    private static nestToFlat(obj: any, prefix = ''): Record<string, string> {
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
}
