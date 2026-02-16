import { Entity, GenericCase, IndustryType } from '@/lib/schemas';

/**
 * Maps an Entity (Legacy Entity) to a Generic Case (Vision 2.0).
 */
export function mapEntityToCase(entity: any, tenantId: string): GenericCase {
    return {
        _id: entity._id?.toString() || '',
        tenantId,
        industry: 'ELEVATORS' as IndustryType,
        type: 'General',
        priority: 'MEDIUM', // Default for legacy
        status: entity.status === 'analyzed' ? 'COMPLETED' : 'IN_PROGRESS',
        metadata: {
            industry_specific: {
                identifier: entity.identifier,
                detectedPatterns: entity.detectedPatterns,
                originalText: entity.originalText,
            },
            taxonomies: {},
            tags: ['general'],
        },
        createdAt: entity.createdAt || new Date(),
        updatedAt: new Date(),
        transitions_history: entity.transitions_history || [],
    };
}

/**
 * Maps a Generic Case back to the structure expected by the Entity UI (Compatibility).
 */
export function mapCaseToEntity(genericCase: GenericCase): any {
    if (genericCase.industry !== 'ELEVATORS') return null;

    return {
        _id: genericCase._id,
        identifier: genericCase.metadata.industry_specific.identifier,
        originalText: genericCase.metadata.industry_specific.originalText,
        detectedPatterns: genericCase.metadata.industry_specific.detectedPatterns,
        status: genericCase.status === 'COMPLETED' ? 'analyzed' : 'processing',
        createdAt: genericCase.createdAt,
    };
}
