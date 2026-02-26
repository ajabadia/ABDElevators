import { VerticalConfig } from '../../lib/schemas/verticals';

export const ELEVATORS_CONFIG: VerticalConfig = {
    industry: 'ELEVATORS',
    entityLabel: { es: 'Pedido', en: 'Order' },
    entityLabelPlural: { es: 'Pedidos', en: 'Orders' },
    promptPack: 'ELEVATORS',
    features: {
        'TECHNICAL_ANALYSIS': true,
        'PREDICTIVE_MAINTENANCE': true
    },
    fields: [
        {
            key: 'numero_pedido',
            label: { es: 'Nº Pedido', en: 'Order No.' },
            type: 'string',
            required: true
        },
        {
            key: 'cliente',
            label: { es: 'Cliente', en: 'Client' },
            type: 'string',
            required: true
        },
        {
            key: 'modelo',
            label: { es: 'Modelo', en: 'Model' },
            type: 'string',
            required: false
        },
        {
            key: 'estado',
            label: { es: 'Estado', en: 'Status' },
            type: 'select',
            required: false,
            options: [
                { label: { es: 'Pendiente', en: 'Pending' }, value: 'PENDING' },
                { label: { es: 'Analizado', en: 'Analyzed' }, value: 'ANALYZED' },
                { label: { es: 'Error', en: 'Error' }, value: 'ERROR' }
            ]
        },
        {
            key: 'creado',
            label: { es: 'Fecha', en: 'Date' },
            type: 'date',
            required: false
        }
    ]
};
