
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * Utilidad para el parseo resiliente de JSON proveniente de LLMs.
 */
export async function safeParseLlmJson<T>(params: {
    raw: string;
    schema: z.ZodSchema<T>;
    source: string;
    correlationId: string;
    tenantId?: string;
}): Promise<T> {
    const { raw, schema, source, correlationId, tenantId } = params;

    let parsed: any = null;
    let method = 'DIRECT';

    try {
        parsed = JSON.parse(raw.trim());
    } catch (e) {
        method = 'REGEX_MATCH';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (e2) {
                method = 'MARKDOWN_CLEAN';
                const cleaned = raw
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                try {
                    parsed = JSON.parse(cleaned);
                } catch (e3) {
                    method = 'REPAIR_ATTEMPT';
                    const repaired = jsonMatch[0]
                        .replace(/,\s*([\]}])/g, '$1')
                        .trim();

                    try {
                        parsed = JSON.parse(repaired);
                    } catch (e4) {
                        await logEvento({
                            level: 'ERROR',
                            source,
                            action: 'LLM_PARSE_FATAL_FAILURE',
                            message: 'Could not parse LLM JSON after multiple attempts',
                            correlationId,
                            tenantId,
                            details: {
                                rawLength: raw.length,
                                snippet: raw.slice(0, 500),
                                error: (e4 as Error).message
                            }
                        });
                        throw new AppError('LLM_INVALID_RESPONSE', 500, 'La IA no devolvió un JSON válido después de varios intentos de recuperación');
                    }
                }
            }
        } else {
            throw new AppError('LLM_INVALID_RESPONSE', 500, 'La IA no incluyó un bloque JSON en su respuesta');
        }
    }

    try {
        const validated = schema.parse(parsed);

        if (method !== 'DIRECT') {
            await logEvento({
                level: 'INFO',
                source,
                action: 'LLM_PARSE_RECOVERY',
                message: `JSON parsed successfully using ${method} fallback`,
                correlationId,
                tenantId,
                details: { method }
            });
        }

        return validated;
    } catch (zodError) {
        await logEvento({
            level: 'ERROR',
            source,
            action: 'LLM_SCHEMA_VALIDATION_FAILURE',
            message: 'LLM JSON parsed but failed schema validation',
            correlationId,
            tenantId,
            details: {
                method,
                errors: (zodError as z.ZodError).issues,
                parsedSnippet: JSON.stringify(parsed).slice(0, 500)
            }
        });
        throw new AppError('LLM_INVALID_FORMAT', 500, 'La respuesta de la IA no cumple con el esquema requerido');
    }
}
