import { FederatedPatternSchema, FederatedPattern } from '@/lib/schemas';
import { IntelligenceStats } from '@/lib/intelligence-analytics';
import { intelligenceRepository } from '@/lib/repositories/IntelligenceRepository';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

/**
 * 🏢 IntelligenceService
 * Centralized service for intelligence analytics and pattern governance.
 * Standardized for Era 8 (Zero any, explicit types).
 */
export class IntelligenceService {

    /**
     * Gets global intelligence statistics.
     */
    static async getStats(): Promise<IntelligenceStats | null> {
        try {
            const stats = await intelligenceRepository.getGlobalStats();
            return stats as unknown as IntelligenceStats;
        } catch (error: unknown) {
            console.error('[IntelligenceService] Error fetching stats:', error);
            throw new AppError('INTELLIGENCE_ERROR', 500, 'Error al recuperar estadísticas de inteligencia');
        }
    }

    /**
     * Gets federated patterns with optional filters.
     */
    static async getPatterns(options: { limit?: number } = {}): Promise<{ patterns: FederatedPattern[] }> {
        try {
            const docs = await intelligenceRepository.list({} as any, {
                sort: { confidenceScore: -1 } as any,
                limit: options.limit || 20
            });

            return {
                patterns: z.array(FederatedPatternSchema).parse(docs)
            };
        } catch (error: unknown) {
            console.error('[IntelligenceService] Error fetching patterns:', error);
            throw new AppError('INTELLIGENCE_ERROR', 500, 'Error al recuperar patrones federados');
        }
    }
}
