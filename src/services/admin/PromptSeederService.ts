
import { connectDB } from '@/lib/db';
import { PromptSchema } from '@/lib/schemas';
import { DEFAULT_PROMPTS } from '@/lib/prompts/core-definitions';
import { ObjectId } from 'mongodb';

/**
 * 🛰️ Prompt Seeder Service
 * Proposito: Sincronizar y versionar prompts base para múltiples tenants.
 */
export class PromptSeederService {
    /**
     * Sincroniza todos los prompts para la lista de tenants proporcionada.
     */
    static async syncAll(tenants: string[]) {
        console.log('🌱 Iniciando sincronización de prompts...\n');
        const db = await connectDB();
        const collection = db.collection('prompts');
        const versionsCollection = db.collection('prompt_versions');

        // 1. Limpieza de datos corruptos (Regla de higiene)
        await collection.deleteMany({ tenantId: { $regex: /^"/ } });

        for (const tenantId of tenants) {
            console.log(`🏢 Procesando Tenant: ${tenantId}`);

            for (const basePrompt of DEFAULT_PROMPTS) {
                const promptData = { ...basePrompt, tenantId };

                const existing = await collection.findOne({
                    key: promptData.key,
                    tenantId: promptData.tenantId
                }) as unknown as Record<string, unknown> | null;

                if (existing) {
                    if (this.hasChanges(existing, promptData)) {
                        console.log(`🆙 Versionando prompt "${promptData.key}" para ${tenantId}...`);

                        const existingPrompt = existing as unknown as { _id: ObjectId, version?: number, template: string, variables?: Record<string, unknown> };
                        await versionsCollection.insertOne({
                            promptId: existingPrompt._id,
                            tenantId: existing.tenantId,
                            version: existingPrompt.version,
                            template: existingPrompt.template,
                            variables: existingPrompt.variables,
                            changedBy: 'system-seed',
                            changeReason: 'Core Update via PromptSeederService',
                            createdAt: new Date()
                        });

                        const nextVersion = (existingPrompt.version || 1) + 1;
                        const validated = PromptSchema.parse({
                            ...promptData,
                            version: nextVersion,
                            updatedAt: new Date()
                        });

                        await collection.updateOne({ _id: existingPrompt._id }, { $set: validated });
                    }
                } else {
                    const validated = PromptSchema.parse(promptData);
                    await collection.insertOne(validated);
                    console.log(`✅ Creado: ${promptData.key} (V1) para ${tenantId}`);
                }
            }
        }
        console.log('\n🎉 Sincronización completada');
    }

    private static hasChanges(existing: Record<string, unknown>, target: Record<string, unknown>): boolean {
        return (existing as any).template !== (target as any).template ||
            (existing as any).model !== (target as any).model ||
            JSON.stringify((existing as any).variables) !== JSON.stringify((target as any).variables);
    }
}
