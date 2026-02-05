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

        // 1. Obtener valores origen (Multinivel: Redis -> DB -> JSON)
        const sourceMessages = await this.getMessages(sourceLocale);
        const flatSource = this.nestToFlat(sourceMessages);

        const translationsToProcess = keys
            .map(key => flatSource[key] ? `"${key}": "${flatSource[key]}"` : null)
            .filter(Boolean)
            .join('\n');

        if (!translationsToProcess) {
            return { success: false, message: 'No source texts found for requested keys' };
        }

        // 2. Obtener Prompt Dinámico (Fase standard del proyecto)
        let prompt: string;
        let model: string = 'gemini-1.5-flash';

        try {
            const rendered = await PromptService.getRenderedPrompt(
                'I18N_AUTO_TRANSLATE',
                { sourceLocale, targetLocale, translationsToProcess },
                tenantId
            );
            prompt = rendered.text;
            model = rendered.model;
        } catch (err) {
            console.warn(`[i18n-ai] ⚠️ Fallback to master prompt for I18N_AUTO_TRANSLATE:`, err);
            prompt = PROMPTS.I18N_AUTO_TRANSLATE
                .replace('{{sourceLocale}}', sourceLocale)
                .replace('{{targetLocale}}', targetLocale)
                .replace('{{translationsToProcess}}', translationsToProcess);
        }

        const response = await callGemini(prompt, tenantId, correlationId, { temperature: 0.1, model });

        try {
            // Limpiar posible markdown de la respuesta
            const jsonStr = response.replace(/```json|```/g, '').trim();
            const translatedMap = JSON.parse(jsonStr);

            // 3. Persistir resultados
            const operations = Object.entries(translatedMap).map(([key, value]) => ({
                updateOne: {
                    filter: { key, locale: targetLocale },
                    update: {
                        $set: {
                            value,
                            locale: targetLocale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            updatedBy: 'AI_GEMINI'
                        }
                    },
                    upsert: true
                }
            }));

            if (operations.length > 0) {
                await collection.bulkWrite(operations);
                await redis.del(`i18n:${targetLocale}`);
            }

            return { success: true, count: operations.length };
        } catch (error) {
            console.error('[TranslationService] AI Parse Error:', response);
            throw new AppError('EXTERNAL_SERVICE_ERROR', 500, 'Fallo al procesar traducción de IA');
        }
    }

    /**
     * Fuerza la sincronización desde el archivo JSON local hacia la DB.
     */
    static async forceSyncFromLocal(locale: string): Promise<Record<string, any>> {
        console.log(`[i18n-sync] 🔄 Iniciando forceSyncFromLocal para locale: '${locale}'`);
        const messages = await this.loadFromLocalFile(locale);
        const keyCount = Object.keys(messages).length;
        console.log(`[i18n-sync] 📂 Cargados ${keyCount} mensajes desde JSON local para '${locale}'`);

        if (keyCount > 0) {
            await this.syncToDb(locale, messages);
            console.log(`[i18n-sync] ✅ Sincronizados ${keyCount} mensajes a MongoDB para '${locale}'`);
            // Invalidar caché
            await redis.del(`i18n:${locale}`);
            console.log(`[i18n-sync] 🧹 Caché Redis invalidada para '${locale}'`);
        } else {
            console.warn(`[i18n-sync] ⚠️ No se encontraron mensajes en JSON local para '${locale}'`);
        }
        return messages;
    }

    /**
     * Obtiene todos los mensajes para un idioma.
     * Estrategia Read-through: Redis -> MongoDB -> JSON Local
     */
    static async getMessages(locale: string): Promise<Record<string, any>> {
        const cacheKey = `i18n:${locale}`;

        try {
            // 1. Intentar L2: Redis
            const cached = await redis.get<Record<string, any>>(cacheKey);
            if (cached) {
                console.log(`[i18n] 🚀 Cache HIT (Redis) para '${locale}'`);
                return cached;
            }

            // 2. Intentar L3: MongoDB
            const collection = await getTenantCollection(this.COLLECTION, null, 'MAIN', { softDeletes: false });
            const docs = await collection.find({ locale, isObsolete: false });

            let messages: Record<string, any> = {};

            if (docs.length > 0) {
                console.log(`[i18n] 📦 Database HIT (MongoDB) para '${locale}': ${docs.length} registros`);
                messages = this.flatToNested(docs);
            } else {
                // 3. Fallback L4: JSON Local
                console.log(`[i18n] 💾 Fallback to Local JSON para '${locale}'`);
                messages = await this.loadFromLocalFile(locale);

                // Si cargamos de local, sincronizamos a DB en segundo plano para el futuro
                if (Object.keys(messages).length > 0) {
                    console.log(`[i18n] 🔄 Iniciando background sync para '${locale}'`);
                    this.syncToDb(locale, messages).catch(err =>
                        console.error(`[TranslationService] Error background sync ${locale}:`, err)
                    );
                }
            }

            // Guardar en Redis para futuras peticiones
            if (Object.keys(messages).length > 0) {
                await redis.set(cacheKey, messages, { ex: this.CACHE_TTL });
            }

            return messages;
        } catch (error) {
            console.error(`[TranslationService] Critical failure loading ${locale}, falling back to static:`, error);
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
    }) {
        const { key, value, locale, namespace = 'common', userId } = params;
        const collection = await getTenantCollection(this.COLLECTION);

        await collection.updateMany(
            { key, locale },
            {
                $set: {
                    value,
                    namespace,
                    isObsolete: false,
                    lastUpdated: new Date(),
                    updatedBy: userId
                }
            },
            { upsert: true }
        );

        // Invalidar caché en Redis
        await redis.del(`i18n:${locale}`);

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
    private static async syncToDb(locale: string, messages: Record<string, any>) {
        const flat = this.nestToFlat(messages);
        const collection = await getTenantCollection(this.COLLECTION);

        const operations = Object.entries(flat).map(([key, value]) => {
            if (!key || key === '') return null;
            return {
                updateOne: {
                    filter: { key, locale },
                    update: {
                        $set: {
                            value,
                            locale,
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
        }
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
}
