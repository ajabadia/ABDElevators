import { ReportTemplate } from '@/lib/schemas/report-template';

export const RagQualityReportTemplate: ReportTemplate = {
    id: 'rag-quality-v1',
    type: 'ragQuality',
    name: 'RAG Knowledge Quality Assessment',
    description: 'Analysis of retrieval accuracy and knowledge base health',
    version: '1.0.0',
    sections: [
        {
            id: 'overview',
            title: 'System Overview',
            type: 'TEXT',
            content: 'Performance analysis of the Retrieval-Augmented Generation system, focusing on relevance, latency, and hallucination rates.'
        },
        {
            id: 'kpis',
            title: 'Key Performance Indicators',
            type: 'METRICS_GRID',
            dataKey: 'metrics'
        },
        {
            id: 'query_analysis',
            title: 'Query Analysis',
            type: 'CHART_PLACEHOLDER',
            content: 'Query Latency Distribution (ms)'
        },
        {
            id: 'content_gaps',
            title: 'Identified Content Gaps',
            type: 'LIST',
            dataKey: 'recommendations'
        }
    ]
};
