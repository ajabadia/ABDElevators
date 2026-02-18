import { VerticalConfig } from '../../lib/schemas/verticals';

export const INSURANCE_CONFIG: VerticalConfig = {
    industry: 'INSURANCE',
    entityLabel: { es: 'Siniestro', en: 'Claim' },
    entityLabelPlural: { es: 'Siniestros', en: 'Claims' },
    promptPack: 'INSURANCE',
    features: {
        'CLAIM_TRIAGE': true,
        'DAMAGE_ASSESSMENT': true,
        'POLICY_VALIDATION': true
    },
    fields: [
        {
            key: 'policy_number',
            label: { es: 'Número de Póliza', en: 'Policy Number' },
            type: 'string',
            required: true
        },
        {
            key: 'incident_type',
            label: { es: 'Tipo de Incidente', en: 'Incident Type' },
            type: 'select',
            required: true,
            options: [
                { label: { es: 'Accidente', en: 'Accident' }, value: 'ACCIDENT' },
                { label: { es: 'Robo', en: 'Theft' }, value: 'THEFT' },
                { label: { es: 'Daño por Agua', en: 'Water Damage' }, value: 'WATER_DAMAGE' }
            ]
        }
    ]
};
