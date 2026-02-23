import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * 🧪 LlmJsonParser
 * Unified utility for resilient parsing of LLM-generated JSON (Era 7).
 * Consolidates safe-llm-json.ts and LlmJsonUtils.ts patterns.
 */
export class LlmJsonParser {
    /**
     * Cleans common LLM noise from a string.
     */
    static clean(raw: string): string {
        if (!raw) return '';

        // Remove markdown fences
        let clean = raw.replace(/```json|```/g, '').trim();

        // Extract content between first { and last } or [ and ]
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');

        if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            clean = clean.slice(firstBrace, lastBrace + 1);
        } else if (firstBracket !== -1 && lastBracket !== -1) {
            clean = clean.slice(firstBracket, lastBracket + 1);
        }

        // Remove trailing commas before closing braces/brackets
        clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        return clean;
    }

    /**
     * Resiliently parses JSON with multiple recovery strategies.
     */
    static parse<T>(params: {
        raw: string;
        schema: z.ZodSchema<T>;
        source: string;
        correlationId: string;
        tenantId?: string;
    }): T {
        const { raw, schema, source, correlationId, tenantId } = params;

        let parsed: any = null;
        let recoveryMethod = 'DIRECT';

        const cleaned = this.clean(raw);

        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            // Last resort repair attempt for unbalanced braces (common in truncated responses)
            recoveryMethod = 'REPAIR';
            try {
                let repaired = cleaned;
                const openBraces = (repaired.match(/{/g) || []).length;
                const closeBraces = (repaired.match(/}/g) || []).length;
                if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);

                const openBrackets = (repaired.match(/\[/g) || []).length;
                const closeBrackets = (repaired.match(/]/g) || []).length;
                if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);

                parsed = JSON.parse(repaired);
            } catch (e2) {
                logEvento({
                    level: 'ERROR',
                    source: 'LLM_JSON_PARSER',
                    action: 'PARSE_FATAL_FAILURE',
                    message: 'Could not parse LLM JSON after repair attempts',
                    correlationId,
                    tenantId,
                    details: { raw: raw.slice(0, 500), error: (e2 as Error).message }
                }).catch(() => { });
                throw new AppError('LLM_INVALID_RESPONSE', 500, 'La IA no devolvió un JSON válido');
            }
        }

        try {
            return schema.parse(parsed);
        } catch (zodError) {
            logEvento({
                level: 'ERROR',
                source: 'LLM_JSON_PARSER',
                action: 'SCHEMA_VALIDATION_FAILURE',
                message: 'LLM JSON parsed but failed schema validation',
                correlationId,
                tenantId,
                details: {
                    method: recoveryMethod,
                    errors: (zodError as z.ZodError).issues,
                    parsed: JSON.stringify(parsed).slice(0, 500)
                }
            }).catch(() => { });
            throw new AppError('LLM_INVALID_FORMAT', 500, 'La respuesta de la IA no cumple con el esquema requerido');
        }
    }
}
