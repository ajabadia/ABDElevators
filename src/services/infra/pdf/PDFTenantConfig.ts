
/**
 * PDFTenantConfig - Resolves extraction and PII settings based on tenant profile.
 * Phase 8.1 Orchestration.
 */
export class PDFTenantConfig {

    /**
     * Maps tenant and industry to a concrete ingestion configuration.
     */
    static getIngestionConfig(tenantId: string, industry: string = 'GENERIC') {
        // In a real scenario, this would check DB or Cache.
        // For now, we use business-rule hardcoding as per spec.

        const isFinancial = industry.toUpperCase() === 'FINANCIAL' || industry.toUpperCase() === 'FINANCE';

        return {
            extraction: {
                strategy: isFinancial ? 'ADVANCED' : 'AUTO',
            },
            pii: {
                enabled: isFinancial || tenantId.includes('demo_secured'),
                detectOnly: tenantId.includes('demo_audit'),
                placeholder: '[PII_REMOVAL]',
                modes: ['ES', 'INTL']
            }
        };
    }
}
