import { BaseRepository } from './BaseRepository';
import { TenantBillingConfig } from '@/lib/schemas/billing';

/**
 * 🏛️ BillingRepository
 * Repositorio para configuración de facturación por tenant.
 * Cluster: MAIN (o BILLING si se separa en el futuro)
 */
export class BillingRepository extends BaseRepository<TenantBillingConfig> {
    constructor() {
        super('tenant_billing_configs', 'MAIN');
    }
}

export const billingRepository = new BillingRepository();
