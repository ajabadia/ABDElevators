import { IndustryType } from '@/lib/schemas';
import { VerticalConfig, VerticalConfigSchema } from '@/lib/schemas/verticals';

/**
 * 🛰️ Vertical Registry Service
 * Central dispatcher for industry-specific configurations.
 * (Phase 98: Vertical Industry Packs)
 */
export class VerticalRegistryService {
    private static configs: Partial<Record<IndustryType, VerticalConfig>> = {
        ELEVATORS: {
            industry: 'ELEVATORS',
            entityLabel: { es: 'Pedido', en: 'Order' },
            entityLabelPlural: { es: 'Pedidos', en: 'Orders' },
            promptPack: 'ELEVATORS',
            features: {
                'CHECKLIST_GENERATION': true,
                'REPORT_BRANDING': true,
            },
            fields: []
        },
        LEGAL: {
            industry: 'LEGAL',
            entityLabel: { es: 'Contrato', en: 'Contract' },
            entityLabelPlural: { es: 'Contratos', en: 'Contracts' },
            promptPack: 'LEGAL',
            defaultChecklistTemplate: '@/verticals/legal/templates/checklist-empty.json',
            features: {
                'CLAUSE_COMPARISON': true,
                'RISK_ASSESSMENT': true,
            },
            fields: []
        },
        BANKING: {
            industry: 'BANKING',
            entityLabel: { es: 'Expediente', en: 'File' },
            entityLabelPlural: { es: 'Expedientes', en: 'Files' },
            promptPack: 'BANKING',
            defaultChecklistTemplate: '@/verticals/banking/templates/checklist-empty.json',
            features: {
                'KYC_VALIDATION': true,
                'AML_SCREENING': true,
            },
            fields: []
        },
        INSURANCE: {
            industry: 'INSURANCE',
            entityLabel: { es: 'Siniestro', en: 'Claim' },
            entityLabelPlural: { es: 'Siniestros', en: 'Claims' },
            promptPack: 'INSURANCE',
            defaultChecklistTemplate: '@/verticals/insurance/templates/checklist-empty.json',
            features: {
                'CLAIM_TRIAGE': true,
                'DAMAGE_ASSESSMENT': true,
            },
            fields: []
        },
        REAL_ESTATE: {
            industry: 'REAL_ESTATE',
            entityLabel: { es: 'Inmueble', en: 'Property' },
            entityLabelPlural: { es: 'Inmuebles', en: 'Properties' },
            promptPack: 'REAL_ESTATE',
            defaultChecklistTemplate: '@/verticals/real-estate/templates/checklist-empty.json',
            features: {
                'PROPERTY_TWIN': true,
                'MAINTENANCE_RAG': true,
            },
            fields: []
        }
    };

    /**
     * Retrieves the configuration for a specific industry.
     * Defaults to GENERIC if not found.
     */
    static getConfig(industry: IndustryType): VerticalConfig {
        const config = this.configs[industry] || this.configs['GENERIC'] || this.configs['ELEVATORS'];
        return VerticalConfigSchema.parse(config);
    }

    /**
     * Returns all available vertical configurations.
     */
    static getAllConfigs(): VerticalConfig[] {
        return Object.values(this.configs).map(c => VerticalConfigSchema.parse(c));
    }
}
