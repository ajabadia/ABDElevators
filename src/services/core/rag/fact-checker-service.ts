import { z } from "zod";
import { callGeminiMini } from "@/services/llm/llm-service";
import { RagResult } from "@/services/core/RagService";
import { logEvento } from "@/lib/logger";
import { DEFAULT_MODEL } from "@/lib/constants/ai-models";

const ClaimSchema = z.object({
    claim: z.string(),
    type: z.enum(['date', 'number', 'entity', 'fact', 'procedure']),
    requiresVerification: z.boolean()
});

const FactCheckResultSchema = z.object({
    verified: z.boolean(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
    sourceReference: z.string().optional()
});

export interface FactCheckReport {
    hallucinationScore: number; // 0 to 1, where 1 is total hallucination
    isReliable: boolean;
    details: Array<{
        claim: string;
        verified: boolean;
        reason: string;
    }>;
}

/**
 * FactCheckerService (FASE 170)
 * Provee verificación profunda de claims para mitigar alucinaciones en RAG.
 */
export class FactCheckerService {
    /**
     * Extrae claims verificables de una respuesta generada.
     */
    private static async extractClaims(
        text: string,
        tenantId: string,
        correlationId: string
    ): Promise<z.infer<typeof ClaimSchema>[]> {
        const prompt = `
            Extrae las afirmaciones factuales (claims) del siguiente texto técnico.
            Para cada una, determina si es un dato específico que requiere verificación (números, fechas, entidades, procedimientos).
            
            TEXTO:
            "${text}"
            
            Responde ÚNICAMENTE en JSON con el siguiente formato:
            {
                "claims": [
                    { "claim": "...", "type": "date|number|entity|fact|procedure", "requiresVerification": true }
                ]
            }
        `;

        try {
            const response = await callGeminiMini(prompt, tenantId, {
                correlationId,
                temperature: 0,
                model: DEFAULT_MODEL
            });
            const data = JSON.parse(response);
            return z.array(ClaimSchema).parse(data.claims);
        } catch (error) {
            console.error("[FACT_CHECKER] Error extracting claims:", error);
            return [];
        }
    }

    /**
     * Verifica una lista de claims contra el contexto recuperado.
     */
    public static async verify(
        text: string,
        context: RagResult[],
        tenantId: string,
        correlationId: string
    ): Promise<FactCheckReport> {
        const claims = await this.extractClaims(text, tenantId, correlationId);
        const contextText = context.map(c => c.text).join("\n\n---\n\n");
        const verificationDetails: Array<{ claim: string; verified: boolean; reason: string }> = [];

        if (claims.length === 0) {
            return { hallucinationScore: 0, isReliable: true, details: [] };
        }

        for (const claim of claims.filter(c => c.requiresVerification)) {
            const prompt = `
                Como experto en control de calidad RAG, verifica si la siguiente afirmación es CORRECTA basándote EXCLUSIVAMENTE en el CONTEXTO proporcionado.
                
                AFIRMACIÓN: "${claim.claim}"
                CONTEXTO:
                ${contextText}
                
                Responde ÚNICAMENTE en JSON:
                {
                    "verified": true/false,
                    "reason": "breve explicación",
                    "confidence": 0.0 a 1.0
                }
            `;

            try {
                const response = await callGeminiMini(prompt, tenantId, {
                    correlationId,
                    temperature: 0,
                    model: DEFAULT_MODEL
                });
                const result = FactCheckResultSchema.parse(JSON.parse(response));
                verificationDetails.push({
                    claim: claim.claim,
                    verified: result.verified,
                    reason: result.reason
                });
            } catch (e) {
                // Si falla la verificación, somos conservadores y lo marcamos como no verificado
                verificationDetails.push({
                    claim: claim.claim,
                    verified: false,
                    reason: "Error en motor de verificación"
                });
            }
        }

        const failedClaims = verificationDetails.filter(d => !d.verified).length;
        const totalClaims = verificationDetails.length;
        const hallucinationScore = totalClaims > 0 ? failedClaims / totalClaims : 0;

        const isReliable = hallucinationScore < 0.2; // Umbral de tolerancia

        await logEvento({
            level: isReliable ? 'INFO' : 'WARN',
            source: 'FACT_CHECKER',
            action: 'VERIFY_RAG',
            message: `Verificación RAG completada. Score: ${hallucinationScore}`,
            correlationId,
            details: { hallucinationScore, totalClaims, failedClaims }
        });

        return {
            hallucinationScore,
            isReliable,
            details: verificationDetails
        };
    }
}
