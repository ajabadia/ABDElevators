
import { FeatureFlags } from '@/lib/feature-flags';

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
    static shouldExecuteGraphRag(asset: any): boolean {
        return FeatureFlags.isGraphRagEnabled() && asset.enableGraphRag;
    }

    /**
     * Retorna opciones de análisis normalizadas.
     */
    static getAnalysisOptions(asset: any, options: any) {
        return {
            enableVision: Boolean(asset.enableVision ?? options.enableVision),
            enableTranslation: Boolean(asset.enableTranslation ?? options.enableTranslation),
            enableGraphRag: Boolean(asset.enableGraphRag ?? options.enableGraphRag),
            enableCognitive: Boolean(asset.enableCognitive ?? options.enableCognitive),
            maskPii: Boolean(asset.maskPii ?? options.maskPii)
        };
    }
}
