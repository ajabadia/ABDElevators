import { VerticalConfig } from '../../lib/schemas/verticals';

export const REAL_ESTATE_CONFIG: VerticalConfig = {
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
};
