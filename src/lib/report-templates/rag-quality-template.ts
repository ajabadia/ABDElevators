import { ReportTemplate } from '../schemas/report-template';

export const RagQualityReportTemplate: ReportTemplate = {
    id: 'tpl_rag_quality_v1',
    name: 'Evaluación de Calidad RAG',
    type: 'RAG_QUALITY',
    version: '1.0.0',
    defaultConfig: {
        primaryColor: '#8b5cf6', // Violet 500
        orientation: 'p',
        includeSources: true
    },
    sections: [
        {
            id: 'performance_metrics_grid',
            key: 'performance_metrics',
            title: 'Métricas de Rendimiento',
            type: 'METRICS_GRID',
            description: 'Evaluación cuantitativa del modelo de recuperación',
            dataSource: 'metrics',
            layout: { columns: 2 }
        },
        {
            id: 'quality_analysis_text',
            key: 'quality_analysis',
            title: 'Análisis de Calidad',
            type: 'TEXT',
            dataSource: 'analysisText'
        },
        {
            id: 'top_sources_table',
            key: 'top_sources',
            title: 'Fuentes de Mayor Relevancia',
            type: 'DATA_TABLE',
            description: 'Documentos con mayor puntuación de similitud',
            dataSource: 'topSources'
        },
        {
            id: 'hallucination_risks_table',
            key: 'hallucination_risks',
            title: 'Riesgos de Alucinación Detectados',
            type: 'DATA_TABLE',
            description: 'Segmentos con baja consistencia factual',
            dataSource: 'hallucinations',
            layout: { breakPageBefore: true }
        }
    ]
};
