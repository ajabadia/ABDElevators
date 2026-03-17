import { SUPPORTED_LOCALES } from '@/lib/i18n-config';
import { I18nObjectUtils } from '@/lib/i18n/i18n-object-utils';
import { TranslationRepository } from './translation/TranslationRepository';
import { TranslationCache } from './translation/TranslationCache';
import { TranslationLLMService } from './translation/TranslationLLMService';
import { TranslationSyncService } from './translation/TranslationSyncService';
import { Translation } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * ⚙️ TranslationService (Fase 213 Modularized)
 * Fachada principal para la gestión de internacionalización.
 */
export class TranslationService {
    static readonly SUPPORTED_LOCALES = SUPPORTED_LOCALES;

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

        const [sourceMessages, targetMessages] = await Promise.all([
            this.getMessages(sourceLocale, tenantId),
            this.getMessages(targetLocale, tenantId)
        ]);
        const flatSource = I18nObjectUtils.flattenObject(sourceMessages);
        const flatTarget = I18nObjectUtils.flattenObject(targetMessages);

        const allValidKeys = keys.filter(key => !!flatSource[key] && !flatTarget[key]);

        if (allValidKeys.length === 0) return { success: true, count: 0 };

        const keysToProcess = allValidKeys
            .map(key => `"${key}": "${flatSource[key]}"`)
            .join('\n');

        return await TranslationLLMService.autoTranslate({
            sourceLocale,
            targetLocale,
            keysToProcess,
            tenantId,
            correlationId
        });
    }

    /**
     * Sincronización BIDIRECCIONAL inteligente.
     */
    static async syncBidirectional(
        locale: string,
        direction: 'to-db' | 'to-file',
        tenantId = '000000000000000000000000',
        options: { force?: boolean } = {}
    ) {
        if (direction === 'to-db') {
            const messages = await TranslationSyncService.loadFromLocalFile(locale);
            return await TranslationSyncService.syncToDb(locale, messages, tenantId);
        } else {
            return await TranslationSyncService.exportToLocalFiles(locale, tenantId);
        }
    }

    /**
     * Obtiene todos los mensajes para un idioma dado.
     */
    static async getMessages(locale: string, tenantId: string = '000000000000000000000000'): Promise<Record<string, unknown>> {
        const cached = await TranslationCache.getCachedMessages(locale, tenantId);

        const localMessages = await TranslationSyncService.loadFromLocalFile(locale);

        // Force refresh if essential namespaces (added in recent phases) are missing from CACHE
        // but verify if they exist in LOCAL files first to avoid infinite refresh loops.
        // Deep Check: verify that namespaces like 'ingest' are not just empty objects {}
        const hasEssentialInLocal = localMessages.details && localMessages.cases && localMessages.ingest;
        
        let isEssentialMissingInCache = false;
        if (cached) {
            const hasIngest = cached.ingest && typeof cached.ingest === 'object' && Object.keys(cached.ingest).length > 2;
            const hasDetails = cached.details && typeof cached.details === 'object' && Object.keys(cached.details).length > 2;
            const hasCases = cached.cases && typeof cached.cases === 'object' && Object.keys(cached.cases).length > 2;
            
            isEssentialMissingInCache = !hasIngest || !hasDetails || !hasCases;
        }

        if (cached && Object.keys(cached).length > 0 && !(isEssentialMissingInCache && hasEssentialInLocal)) {
            return cached;
        }

        await logEvento({
            level: 'INFO',
            source: 'TRANSLATION_SERVICE',
            action: 'CACHE_MISS',
            message: `Cache miss or essential missing for locale: ${locale}, tenant: ${tenantId}. Loading from DB/Local.`,
            details: { locale, tenantId, isEssentialMissingInCache, hasEssentialInLocal }
        });

        let finalMessages = { ...localMessages };

        // [INGEST_TRACE] Force sync to DB if essential is missing in cache but exists in local
        if (isEssentialMissingInCache && hasEssentialInLocal) {
            await logEvento({
                level: 'WARN',
                source: 'TRANSLATION_SERVICE',
                action: 'FORCE_SYNC',
                message: `Essential namespaces corrupted or missing in cache for ${locale}. Triggering force sync to DB.`,
                details: { locale, tenantId }
            });
            await TranslationSyncService.syncToDb(locale, localMessages, tenantId);
        }

        try {
            const masterDocs = await TranslationRepository.findMessages(locale, '000000000000000000000000') as Translation[];
            if (masterDocs.length > 0) {
                const masterOverrides = I18nObjectUtils.flatToNested(
                    Object.fromEntries(masterDocs.map((d) => [d.key, d.value]))
                );
                finalMessages = I18nObjectUtils.deepMerge(finalMessages, masterOverrides);
            }

            if (tenantId !== '000000000000000000000000') {
                const tenantDocs = await TranslationRepository.findMessages(locale, tenantId) as Translation[];
                if (tenantDocs.length > 0) {
                    const tenantOverrides = I18nObjectUtils.flatToNested(
                        Object.fromEntries(tenantDocs.map((d) => [d.key, d.value]))
                    );
                    finalMessages = I18nObjectUtils.deepMerge(finalMessages, tenantOverrides);
                }
            }
        } catch (dbError) {
            await logEvento({
                level: 'ERROR',
                source: 'TRANSLATION_SERVICE',
                action: 'DB_ERROR',
                message: `CRITICAL: DB Error fetching translations for ${locale}, falling back to local files.`,
                details: { error: dbError instanceof Error ? dbError.message : String(dbError) }
            });
            // We continue with finalMessages (which contains localMessages)
        }

        await TranslationCache.setCachedMessages(locale, tenantId, finalMessages);
        return finalMessages;
    }

    /**
     * Obtiene mensajes con metadatos de origen para el panel admin.
     */
    static async getDetailedMessages(locale: string, tenantId: string = '000000000000000000000000') {
        const localMessages = await TranslationSyncService.loadFromLocalFile(locale);
        const flatLocal = I18nObjectUtils.flattenObject(localMessages);
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(flatLocal)) {
            result[key] = { value, source: 'local' };
        }

        const masterDocs = await TranslationRepository.findMessages(locale, '000000000000000000000000') as Translation[];
        for (const doc of masterDocs) {
            result[doc.key] = { value: doc.value, source: 'master', isCustomized: !!doc.isCustomized };
        }

        if (tenantId !== '000000000000000000000000') {
            const tenantDocs = await TranslationRepository.findMessages(locale, tenantId) as Translation[];
            for (const doc of tenantDocs) {
                result[doc.key] = { value: doc.value, source: 'tenant' };
            }
        }

        return result;
    }

    public static async deleteTranslation(key: string, locale: string, tenantId = '000000000000000000000000') {
        const res = await TranslationRepository.markObsolete(key, locale, tenantId);
        await TranslationCache.invalidate(locale, tenantId);
        return { success: (res as { modifiedCount: number }).modifiedCount > 0 };
    }

    static async updateTranslation(params: { key: string, value: string, locale: string, namespace?: string, userId?: string, tenantId?: string }) {
        const { key, value, locale, namespace, userId, tenantId } = params;
        const effectiveTenantId = tenantId || '000000000000000000000000';
        const filter = { key, locale, tenantId: effectiveTenantId };

        const res = await TranslationRepository.updateOne(filter, {
            $set: {
                value,
                namespace: namespace || key.split('.')[0] || 'common',
                isObsolete: false,
                isCustomized: true,
                lastUpdated: new Date(),
                updatedBy: userId,
                tenantId: effectiveTenantId
            }
        });

        await TranslationCache.invalidate(locale, effectiveTenantId);
        return { success: true };
    }

    /**
     * Obtiene información detallada de una llave específica para debug.
     */
    static async getKeyDebugInfo(locale: string, key: string, tenantId: string = '000000000000000000000000') {
        const localMessages = await TranslationSyncService.loadFromLocalFile(locale);
        const flatLocal = I18nObjectUtils.flattenObject(localMessages);

        const info: Record<string, unknown> = {
            key,
            locale,
            localValue: flatLocal[key] || null,
            sources: [] as { type: string, value: string, isCustomized?: boolean }[]
        };

        if (flatLocal[key]) {
            (info.sources as { type: string, value: string }[]).push({ type: 'FILE', value: flatLocal[key] as string });
        }

        const masterDocs = await TranslationRepository.findMessages(locale, '000000000000000000000000') as Translation[];
        const masterDoc = masterDocs.find((d) => d.key === key);
        if (masterDoc) {
            (info.sources as { type: string, value: string, isCustomized?: boolean }[]).push({ type: 'DB_MASTER', value: masterDoc.value, isCustomized: !!masterDoc.isCustomized });
            info.currentValue = masterDoc.value;
        }

        if (tenantId !== '000000000000000000000000') {
            const tenantDocs = await TranslationRepository.findMessages(locale, tenantId) as Translation[];
            const tenantDoc = tenantDocs.find((d) => d.key === key);
            if (tenantDoc) {
                (info.sources as { type: string, value: string }[]).push({ type: 'DB_TENANT', value: tenantDoc.value });
                info.currentValue = tenantDoc.value;
            }
        }

        if (!info.currentValue) {
            info.currentValue = info.localValue;
        }

        return info;
    }

    static nestToFlat(obj: Record<string, unknown>) { return I18nObjectUtils.flattenObject(obj); }
    static flatToNested(docs: { key: string, value: string }[]) { return I18nObjectUtils.flatToNested(Object.fromEntries(docs.map(d => [d.key, d.value]))); }

    /**
     * Sincroniza desde el archivo local JSON a la base de datos (Legacy facade).
     */
    static async forceSyncFromLocal(locale: string, tenantId = '000000000000000000000000') {
        const messages = await TranslationSyncService.loadFromLocalFile(locale);
        const { added, updated } = await TranslationSyncService.syncToDb(locale, messages, tenantId);
        return { messages, added, updated };
    }

    /**
     * Sincroniza todos los idiomas configurados (Legacy facade).
     */
    static async forceSyncAllLocales(tenantId = '000000000000000000000000') {
        const results: Record<string, unknown> = {};
        for (const locale of SUPPORTED_LOCALES) {
            const { added, updated } = await this.forceSyncFromLocal(locale, tenantId);
            results[locale] = { added, updated };
        }
        return results;
    }

    /**
     * Exporta desde la base de datos a archivos locales JSON (Legacy facade).
     */
    static async exportToLocalFiles(locale: string, tenantId = '000000000000000000000000') {
        return await TranslationSyncService.exportToLocalFiles(locale, tenantId);
    }
}
