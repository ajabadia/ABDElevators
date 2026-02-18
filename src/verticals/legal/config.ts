import { VerticalConfig } from '../../lib/schemas/verticals';

export const LEGAL_CONFIG: VerticalConfig = {
    industry: 'LEGAL',
    entityLabel: { es: 'Contrato', en: 'Contract' },
    entityLabelPlural: { es: 'Contratos', en: 'Contracts' },
    promptPack: 'LEGAL',
    features: {
        'CLAUSE_COMPARISON': true,
        'RISK_ASSESSMENT': true,
        'LEGAL_DISCOVERY': true
    },
    fields: [
        {
            key: 'jurisdiction',
            label: { es: 'Jurisdicción', en: 'Jurisdiction' },
            type: 'string',
            required: true
        },
        {
            key: 'expiry_date',
            label: { es: 'Fecha de Expiración', en: 'Expiry Date' },
            type: 'date',
            required: false
        }
    ]
};
