import { getTenantCollection } from '@/lib/db-tenant';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';
import { ObjectId } from 'mongodb';

export interface AICorrection {
    entitySlug: string;
    originalData: any;
    correctedData: any;
    diff: Record<string, { from: any, to: any }>;
    tenantId: string;
    userId: string;
    correlationId: string;
    createdAt: Date;
}

/**
 * AgentEngine: Gestiona comportamientos autónomos y aprendizaje (Fase 7).
 */
export class AgentEngine {

    constructor() { }

    /**
     * Registra una corrección humana sobre datos generados por IA.
     */
    public async recordCorrection(
        entitySlug: string,
        originalData: any,
        correctedData: any,
        userId: string,
        tenantId: string,
        externalCorrelationId: string
    ) {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'AGENT_ENGINE',
                action: 'RECORD_CORRECTION',
                tenantId,
                correlationId: externalCorrelationId
            },
            async ({ log }) => {
                // Calcular el diff básico
                const diff: Record<string, { from: any, to: any }> = {};
                let hasChanges = false;

                for (const key in correctedData) {
                    if (key === '_id' || key === 'creado' || key === 'actualizado') continue;

                    if (JSON.stringify(originalData[key]) !== JSON.stringify(correctedData[key])) {
                        diff[key] = {
                            from: originalData[key],
                            to: correctedData[key]
                        };
                        hasChanges = true;
                    }
                }

                if (!hasChanges) return null;

                const session = getSystemSession(tenantId);
                const collection = await getTenantCollection('ai_corrections', session as any);

                const correction: AICorrection = {
                    entitySlug,
                    originalData,
                    correctedData,
                    diff,
                    tenantId,
                    userId,
                    correlationId: externalCorrelationId,
                    createdAt: new Date()
                };

                const result = await collection.insertOne(correction as any);

                await log({
                    message: `Recorded correction for ${entitySlug}`,
                    details: { fieldCount: Object.keys(diff).length }
                });

                return result.insertedId;
            }
        );
    }

    /**
     * Obtiene ejemplos de correcciones previas para inyectar en prompts (Few-shot learning).
     */
    public async getCorrectionContext(entitySlug: string, tenantId: string): Promise<string> {
        try {
            const session = getSystemSession(tenantId);
            const collection = await getTenantCollection('ai_corrections', session as any);

            // Traer las últimas 5 correcciones significativas
            const corrections = await (collection.find({ entitySlug }) as any).toArray();

            if (!corrections || corrections.length === 0) return "";

            let context = "\n\nBASADO EN CORRECCIONES PREVIAS DEL USUARIO:\n";
            corrections.slice(0, 5).forEach((c: AICorrection) => {
                for (const [field, delta] of Object.entries(c.diff)) {
                    context += `- En lugar de extraer "${delta.from}" para el campo "${field}", el usuario prefiere "${delta.to}".\n`;
                }
            });

            return context;
        } catch (error) {
            return "";
        }
    }
}
