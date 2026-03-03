
import { PromptSeederService } from '../src/services/admin/PromptSeederService';
import * as dotenv from 'dotenv';
import path from 'path';

/**
 * Script de inicialización de prompts (Seed).
 * Refactorizado Fase 213: Ahora usa PromptSeederService.
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const rawTenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
const CORE_TENANTS = Array.from(new Set([
    rawTenantId.replace(/^["']|["']$/g, ''),
    'platform_master',
    'default_tenant'
]));

async function main() {
    try {
        await PromptSeederService.syncAll(CORE_TENANTS);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal en el seed:', error);
        process.exit(1);
    }
}

main();
