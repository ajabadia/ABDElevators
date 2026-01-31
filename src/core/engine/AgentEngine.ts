import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
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
 * AgentEngine: Gestiona comportamientos autónomos y aprendizaje (Fase KIMI 7).
 */
export class AgentEngine {
    private static instance: AgentEngine;

    private constructor() { }

    public static getInstance(): AgentEngine {
        if (!AgentEngine.instance) {
            AgentEngine.instance = new AgentEngine();
        }
        return AgentEngine.instance;
    }

    /**
     * Registra una corrección humana sobre datos generados por IA.
     */
    public async recordCorrection(
        entitySlug: string,
        originalData: any,
        correctedData: any,
        userId: string,
        tenantId: string,
        correlationId: string
    ) {
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

        try {
            const collection = await getTenantCollection('ai_corrections', { user: { tenantId } });

            const correction: AICorrection = {
                entitySlug,
                originalData,
                correctedData,
                diff,
                tenantId,
                userId,
                correlationId,
                createdAt: new Date()
            };

            const result = await collection.insertOne(correction as any);

            await logEvento({
                level: 'INFO',
                source: 'AGENT_ENGINE',
                action: 'RECORD_CORRECTION',
                message: `Recorded correction for ${entitySlug}`,
                correlationId,
                details: { fieldCount: Object.keys(diff).length }
            });

            return result.insertedId;
        } catch (error: any) {
            console.error('[AgentEngine] Error recording correction:', error);
            return null;
        }
    }

    /**
     * Obtiene ejemplos de correcciones previas para inyectar en prompts (Few-shot learning).
     */
    public async getCorrectionContext(entitySlug: string, tenantId: string): Promise<string> {
        try {
            const collection = await getTenantCollection('ai_corrections', { user: { tenantId } });

            // Traer las últimas 5 correcciones significativas
            const corrections = await collection.find({ entitySlug }) as any;

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
