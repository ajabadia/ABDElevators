import { extractModelsWithGemini } from '@/services/llm/llm-service';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { TenantSession } from '@/lib/db-tenant';

/**
 * 🔍 Ingest Analysis Service
 * Proposito: Gestión de detección de idioma, industria y extracción de modelos.
 */
export class IngestAnalysisService {
    /**
     * Detecta el idioma del texto.
     */
    static async detectLanguage(text: string, tenantId: string, correlationId: string, session?: TenantSession): Promise<string> {
        try {
            const detected = await PromptRunner.runText({
                key: 'LANGUAGE_DETECTOR',
                variables: { text: text.substring(0, 2000) },
                tenantId,
                correlationId,
                session: session as unknown as TenantSession
            });

            return (detected || 'es').trim().toLowerCase().substring(0, 2);
        } catch (error) {
            console.warn('[AnalysisService] Language detection failed, fallback to ES');
            return 'es';
        }
    }

    /**
     * Detecta la industria/dominio.
     */
    static async detectIndustry(text: string, tenantId: string, correlationId: string, session?: TenantSession, options?: Record<string, unknown>) {
        const { DomainRouterService } = await import('@/services/core/domain-router-service');
        return await DomainRouterService.detectIndustry(text, tenantId, correlationId, session, options);
    }

    /**
     * Extrae modelos del texto.
     */
    static async extractModels(text: string, tenantId: string, correlationId: string, session?: TenantSession) {
        return await extractModelsWithGemini(text, tenantId, correlationId, session);
    }
}
