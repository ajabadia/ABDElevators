import { PROMPTS } from '@/lib/prompts';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { PromptSchema } from '@/lib/schemas';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { logEvento } from '@/lib/logger';

/**
 * PromptSyncService (Era 17)
 * Centraliza la lógica de sincronización de prompts para automatización en CD.
 */
export class PromptSyncService {
    private static getSystemSession() {
        return {
            user: {
                id: '000000000000000000000000',
                tenantId: '000000000000000000000000',
                role: 'SUPER_ADMIN'
            }
        };
    }

    /**
     * Sincroniza los fallbacks definidos en lib/prompts.ts con la base de datos.
     */
    static async syncAll(tenantId: string = 'abd_global', session?: import('next-auth').Session | null): Promise<{ created: number, updated: number, errors: number }> {
        const collection = await getTenantCollection('prompts', session || this.getSystemSession() as any, 'CONFIG');
        let created = 0, updated = 0, errors = 0;

        for (const [key, master] of Object.entries(PROMPTS)) {
            try {
                const existing = await collection.findOne({ key, tenantId });
                
                if (!existing) {
                    await collection.insertOne(PromptSchema.parse({
                        tenantId,
                        key,
                        name: key.replace(/_/g, ' '),
                        template: master.template,
                        version: master.version,
                        active: true,
                        environment: 'PRODUCTION',
                        industry: 'GENERIC',
                        category: 'GENERAL',
                        model: DEFAULT_MODEL,
                        variables: [],
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));
                    created++;
                    
                    console.log(`[PromptSyncService] Creado prompt: ${key} (v${master.version})`);
                } else if (master.version > (existing.version || 0)) {
                    await collection.updateOne(
                        { _id: existing._id },
                        { 
                            $set: { 
                                template: master.template, 
                                version: master.version, 
                                updatedAt: new Date() 
                            } 
                        }
                    );
                    updated++;
                    
                    console.log(`[PromptSyncService] Actualizado prompt: ${key} to v${master.version}`);
                }
            } catch (err) {
                console.error(`[PromptSyncService] Error sincronizando "${key}":`, err);
                errors++;
            }
        }

        if (created > 0 || updated > 0) {
            await logEvento({
                level: 'INFO',
                source: 'PROMPT_SYNC',
                action: 'SYNC_COMPLETED',
                message: `Sincronización de prompts para ${tenantId} completada: ${created} creados, ${updated} actualizados.`,
                correlationId: `sync-${Date.now()}`,
                details: { created, updated, errors }
            });
        }

        return { created, updated, errors };
    }
}
