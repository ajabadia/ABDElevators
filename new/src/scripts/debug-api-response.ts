import { PromptService } from '../lib/prompt-service';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugApiResponse() {
    console.log('🚀 Simulando API response para /api/admin/prompts...');

    const environment = 'PRODUCTION';
    const tenantId = 'default_tenant'; // El que usa SINGLE_TENANT_ID

    try {
        const prompts = await PromptService.listPrompts({
            tenantId, // Simulamos que el usuario NO es superadmin para ver qué recibe su tenant
            activeOnly: false,
            environment,
            limit: 50
        });

        console.log(`📊 Prompts devueltos por PromptService: ${prompts.length}`);

        prompts.forEach((p: any, i: number) => {
            console.log(`${i + 1}. [${p.key}] - Name: ${p.name}, Env: ${p.environment}, Tenant: ${p.tenantId}`);
        });

        // Ahora simulamos el enriquecimiento que hace la API si fuera SuperAdmin
        const { TenantService } = await import('../lib/tenant-service');
        const tenants = await TenantService.getAllTenants();
        const tenantMap = new Map(tenants.map(t => [t.tenantId, t]));

        console.log(`\n🏢 Tenants registrados en DB: ${tenants.length}`);
        tenants.forEach(t => console.log(`   - ${t.tenantId}: ${t.name}`));

        const enrichedCount = prompts.filter(p => tenantMap.has(p.tenantId)).length;
        console.log(`\n✅ Prompts con TenantInfo encontrado: ${enrichedCount} / ${prompts.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

debugApiResponse();
