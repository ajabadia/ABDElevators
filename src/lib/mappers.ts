import { Pedido, GenericCase, IndustryType } from './schemas';

/**
 * Mapea un Pedido de Ascensor (Legacy) a un Caso Genérico (Vision 2.0).
 */
export function mapPedidoToCase(pedido: any, tenantId: string): GenericCase {
    return {
        _id: pedido._id?.toString() || '',
        tenantId,
        industry: 'ELEVATORS' as IndustryType,
        type: 'Mantenimiento',
        priority: 'MEDIUM', // Valor por defecto para legacy
        status: pedido.estado === 'analizado' ? 'COMPLETED' : 'IN_PROGRESS',
        metadata: {
            industry_specific: {
                numero_pedido: pedido.numero_pedido,
                modelos_detectados: pedido.modelos_detectados,
                texto_original: pedido.texto_original,
            },
            taxonomies: {},
            tags: ['elevator', 'maintenance'],
        },
        creado: pedido.creado || new Date(),
        actualizado: new Date(),
        transitions_history: pedido.transitions_history || [],
    };
}

/**
 * Mapea un Caso Genérico a la estructura esperada por la UI de Pedidos (Compatibilidad).
 */
export function mapCaseToPedido(genericCase: GenericCase): any {
    if (genericCase.industry !== 'ELEVATORS') return null;

    return {
        _id: genericCase._id,
        numero_pedido: genericCase.metadata.industry_specific.numero_pedido,
        texto_original: genericCase.metadata.industry_specific.texto_original,
        modelos_detectados: genericCase.metadata.industry_specific.modelos_detectados,
        estado: genericCase.status === 'COMPLETED' ? 'analizado' : 'procesando',
        creado: genericCase.creado,
    };
}
