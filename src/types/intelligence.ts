export interface IntelligenceMetrics {
    semanticNodes: number;
    semanticRelationships: number;
    tasksAutomated: number;
    learnedCorrections: number;
    estimatedCostSaving: number;
    accuracyTrend: number[];
    topLearningEntities: Array<{
        entity: string;
        count: number;
    }>;
}
