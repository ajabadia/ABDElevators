
import { connectDB } from '@/lib/db';
import { PromptSchema } from '@/lib/schemas';
import { DEFAULT_PROMPTS } from '@/lib/prompts/core-definitions';

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
                const promptData = { ...basePrompt, tenantId } as any;

                const existing = await collection.findOne({
                    key: promptData.key,
                    tenantId: promptData.tenantId
                });

                if (existing) {
                    if (this.hasChanges(existing, promptData)) {
                        console.log(`🆙 Versionando prompt "${promptData.key}" para ${tenantId}...`);

                        // Snapshot de versión anterior
                        await versionsCollection.insertOne({
                            promptId: existing._id,
                            tenantId: existing.tenantId,
                            version: existing.version,
                            template: existing.template,
                            variables: existing.variables,
                            changedBy: 'system-seed',
                            changeReason: 'Core Update via PromptSeederService',
                            createdAt: new Date()
                        });

                        const nextVersion = (existing.version || 1) + 1;
                        const validated = PromptSchema.parse({
                            ...promptData,
                            version: nextVersion,
                            updatedAt: new Date()
                        });

                        await collection.updateOne({ _id: existing._id }, { $set: validated });
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

    private static hasChanges(existing: any, target: any): boolean {
        return existing.template !== target.template ||
            existing.model !== target.model ||
            JSON.stringify(existing.variables) !== JSON.stringify(target.variables);
    }
}
