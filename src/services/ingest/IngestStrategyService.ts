import { FeatureFlags } from '@/services/security/feature-flags';
import { KnowledgeAsset } from '@/lib/schemas';
import { IngestOptions } from './types';

/**
 * 🎯 Ingest Strategy Service
 * Proposito: Encapsular la lógica de decisión sobre qué versión del pipeline o qué features activar.
 */
export class IngestStrategyService {
    /**
     * Retorna si el Pipeline V2 (GridFS based) está activo.
     */
    static isV2Enabled(): boolean {
        return FeatureFlags.isIngestPipelineV2Enabled();
    }

    /**
     * Retorna si GraphRAG debe ejecutarse para este asset.
     */
    static shouldExecuteGraphRag(asset: KnowledgeAsset): boolean {
        return FeatureFlags.isGraphRagEnabled() && !!(asset as any).enableGraphRag;
    }

    /**
     * Retorna opciones de análisis normalizadas.
     */
    static getAnalysisOptions(asset: KnowledgeAsset, options: IngestOptions) {
        return {
            enableVision: Boolean((asset as any).enableVision ?? options.enableVision),
            enableTranslation: Boolean((asset as any).enableTranslation ?? options.enableTranslation),
            enableGraphRag: Boolean((asset as any).enableGraphRag ?? options.enableGraphRag),
            enableCognitive: Boolean((asset as any).enableCognitive ?? options.enableCognitive),
            maskPii: Boolean((asset as any).maskPii ?? options.maskPii)
        };
    }
}
