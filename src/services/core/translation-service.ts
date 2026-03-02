
import { SUPPORTED_LOCALES } from '@/lib/i18n-config';
import { I18nObjectUtils } from '@/lib/i18n/i18n-object-utils';
import { TranslationRepository } from './translation/TranslationRepository';
import { TranslationCache } from './translation/TranslationCache';
import { TranslationLLMService } from './translation/TranslationLLMService';
import { TranslationSyncService } from './translation/TranslationSyncService';

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
        tenantId = 'platform_master',
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
    static async getMessages(locale: string, tenantId: string = 'platform_master'): Promise<Record<string, unknown>> {
        const cached = await TranslationCache.getCachedMessages(locale, tenantId);
        if (cached && Object.keys(cached).length > 0) return cached;

        const localMessages = await TranslationSyncService.loadFromLocalFile(locale);
        let finalMessages = { ...localMessages };

        const masterDocs = await TranslationRepository.findMessages(locale, 'platform_master');
        if (masterDocs.length > 0) {
            const masterOverrides = I18nObjectUtils.flatToNested(
                Object.fromEntries(masterDocs.map(d => [d.key, d.value]))
            );
            finalMessages = I18nObjectUtils.deepMerge(finalMessages, masterOverrides);
        }

        if (tenantId !== 'platform_master') {
            const tenantDocs = await TranslationRepository.findMessages(locale, tenantId);
            if (tenantDocs.length > 0) {
                const tenantOverrides = I18nObjectUtils.flatToNested(
                    Object.fromEntries(tenantDocs.map(d => [d.key, d.value]))
                );
                finalMessages = I18nObjectUtils.deepMerge(finalMessages, tenantOverrides);
            }
        }

        await TranslationCache.setCachedMessages(locale, tenantId, finalMessages);
        return finalMessages;
    }

    /**
     * Obtiene mensajes con metadatos de origen para el panel admin.
     */
    static async getDetailedMessages(locale: string, tenantId: string = 'platform_master') {
        const localMessages = await TranslationSyncService.loadFromLocalFile(locale);
        const flatLocal = I18nObjectUtils.flattenObject(localMessages);
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(flatLocal)) {
            result[key] = { value, source: 'local' };
        }

        const masterDocs = await TranslationRepository.findMessages(locale, 'platform_master');
        for (const doc of masterDocs) {
            result[doc.key] = { value: doc.value, source: 'master', isCustomized: !!doc.isCustomized };
        }

        if (tenantId !== 'platform_master') {
            const tenantDocs = await TranslationRepository.findMessages(locale, tenantId);
            for (const doc of tenantDocs) {
                result[doc.key] = { value: doc.value, source: 'tenant' };
            }
        }

        return result;
    }

    public static async deleteTranslation(key: string, locale: string, tenantId = 'platform_master') {
        const res = await TranslationRepository.markObsolete(key, locale, tenantId);
        await TranslationCache.invalidate(locale, tenantId);
        return { success: res.modifiedCount > 0 };
    }

    static async updateTranslation(params: { key: string, value: string, locale: string, namespace?: string, userId?: string, tenantId?: string }) {
        const { key, value, locale, namespace, userId, tenantId } = params;
        const effectiveTenantId = tenantId || 'platform_master';
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
    static async getKeyDebugInfo(locale: string, key: string, tenantId: string = 'platform_master') {
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

        const masterDocs = await TranslationRepository.findMessages(locale, 'platform_master');
        const masterDoc = masterDocs.find(d => d.key === key);
        if (masterDoc) {
            (info.sources as { type: string, value: string, isCustomized?: boolean }[]).push({ type: 'DB_MASTER', value: masterDoc.value, isCustomized: !!masterDoc.isCustomized });
            info.currentValue = masterDoc.value;
        }

        if (tenantId !== 'platform_master') {
            const tenantDocs = await TranslationRepository.findMessages(locale, tenantId);
            const tenantDoc = tenantDocs.find(d => d.key === key);
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
    static async forceSyncFromLocal(locale: string, tenantId = 'platform_master') {
        const messages = await TranslationSyncService.loadFromLocalFile(locale);
        const { added, updated } = await TranslationSyncService.syncToDb(locale, messages, tenantId);
        return { messages, added, updated };
    }

    /**
     * Sincroniza todos los idiomas configurados (Legacy facade).
     */
    static async forceSyncAllLocales(tenantId = 'platform_master') {
        const results: Record<string, unknown> = {};
        for (const locale of SUPPORTED_LOCALES) {
            results[locale] = await this.forceSyncFromLocal(locale, tenantId);
        }
        return results;
    }

    /**
     * Exporta desde la base de datos a archivos locales JSON (Legacy facade).
     */
    static async exportToLocalFiles(locale: string, tenantId = 'platform_master') {
        return await TranslationSyncService.exportToLocalFiles(locale, tenantId);
    }
}
