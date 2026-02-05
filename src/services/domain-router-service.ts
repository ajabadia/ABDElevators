import { callGeminiMini } from '@/lib/llm';
import { IndustryType } from '@/lib/schemas';

/**
 * 🛰️ Domain Router Service (Phase 101)
 * Detects the industry/vertical of a document using heuristics and AI.
 */
export class DomainRouterService {
    private static KEYWORDS: Record<IndustryType, string[]> = {
        ELEVATORS: ['ascensor', 'elevador', 'lift', 'hoistway', 'maniobra', 'botonera', 'cabin', 'shaft', 'arca ii'],
        LEGAL: ['contract', 'contrato', 'clause', 'jurisdiction', 'liability', 'indemnity', 'agreement', 'legal', 'tribunal', 'ley'],
        BANKING: ['balance', 'asset', 'liability', 'ledger', 'loan', 'mortgage', 'interest rate', 'compliance', 'swift', 'iban', 'banca'],
        INSURANCE: ['policy', 'premium', 'coverage', 'claim', 'underwriting', 'deductible', 'beneficiary', 'póliza', 'siniestro', 'cobertura'],
        IT: ['code', 'api', 'server', 'database', 'frontend', 'backend', 'vulnerability', 'deployment', 'cloud', 'software'],
        GENERIC: []
    };

    /**
     * Detects the industry of a given text.
     */
    static async detectIndustry(text: string, tenantId: string, correlationId?: string): Promise<IndustryType> {
        const lowerText = text.toLowerCase();

        // 1. Heuristics (Quick & Cheap)
        const scores: Record<string, number> = {};

        for (const [industry, keywords] of Object.entries(this.KEYWORDS)) {
            scores[industry] = keywords.reduce((count, kw) => {
                const regex = new RegExp(`\\b${kw}\\b`, 'g');
                return count + (lowerText.match(regex)?.length || 0);
            }, 0);
        }

        const bestHeuristic = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);

        if (bestHeuristic[1] > 3) {
            return bestHeuristic[0] as IndustryType;
        }

        // 2. AI Fallback (If ambiguous)
        try {
            const prompt = `Analiza el siguiente extracto de un documento y clasifícalo en uno de estos sectores: ELEVATORS, LEGAL, BANKING, INSURANCE, IT, GENERIC.
            Responde SOLO con el nombre del sector en mayúsculas.
            
            TEXTO:
            ${text.substring(0, 3000)}`;

            const response = await callGeminiMini(prompt, tenantId, { correlationId });
            const detected = response.trim().toUpperCase();

            const validIndustries: IndustryType[] = ['ELEVATORS', 'LEGAL', 'BANKING', 'INSURANCE', 'IT', 'GENERIC'];
            if (validIndustries.includes(detected as IndustryType)) {
                return detected as IndustryType;
            }
        } catch (error) {
            console.error('[DOMAIN ROUTER ERROR]', error);
        }

        return 'GENERIC';
    }
}
