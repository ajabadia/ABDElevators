import { VerticalConfig } from '../../lib/schemas/verticals';

export const BANKING_CONFIG: VerticalConfig = {
    industry: 'BANKING',
    entityLabel: { es: 'Expediente', en: 'File' },
    entityLabelPlural: { es: 'Expedientes', en: 'Files' },
    promptPack: 'BANKING',
    features: {
        'KYC_VALIDATION': true,
        'AML_SCREENING': true,
        'FRAUD_DETECTION': true
    },
    fields: [
        {
            key: 'client_id',
            label: { es: 'ID de Cliente', en: 'Client ID' },
            type: 'string',
            required: true
        },
        {
            key: 'risk_level',
            label: { es: 'Nivel de Riesgo', en: 'Risk Level' },
            type: 'select',
            required: true,
            options: [
                { label: { es: 'Bajo', en: 'Low' }, value: 'LOW' },
                { label: { es: 'Medio', en: 'Medium' }, value: 'MEDIUM' },
                { label: { es: 'Alto', en: 'High' }, value: 'HIGH' }
            ]
        }
    ]
};
