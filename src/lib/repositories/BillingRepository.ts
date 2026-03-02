import { BaseRepository } from './BaseRepository';
import { TenantBillingConfig } from '@/lib/schemas/billing';

/**
 * 🏛️ BillingRepository
 * Repositorio para la gestión de configuración de facturación y planes.
 * Cluster: MAIN (o BILLING si se separa en el futuro)
 */
export class BillingRepository extends BaseRepository<TenantBillingConfig> {
    protected readonly collectionName = 'tenant_billing_configs';
    // Por ahora usamos el cluster MAIN, pero está preparado para desacoplarse
    protected readonly clusterName = 'MAIN';
}

export const billingRepository = new BillingRepository();
