import { ReportTemplate } from '../schemas/report-template';

export const InspectionReportTemplate: ReportTemplate = {
    id: 'tpl_inspection_v1',
    name: 'Informe de Inspección Técnica',
    type: 'INSPECTION',
    version: '1.0.0',
    defaultConfig: {
        primaryColor: '#0ea5e9', // Sky 500
        orientation: 'p',
        includeSources: false
    },
    sections: [
        {
            id: 'summary_metrics_grid',
            key: 'summary_metrics',
            title: 'Resumen Ejecutivo',
            type: 'METRICS_GRID',
            description: 'Indicadores clave del estado de la inspección',
            dataSource: 'metrics',
            layout: { columns: 3 }
        },
        {
            id: 'equipment_details_table',
            key: 'equipment_details',
            title: 'Detalles del Equipo',
            type: 'DATA_TABLE',
            description: 'Especificaciones técnicas del equipo inspeccionado',
            dataSource: 'equipment'
        },
        {
            id: 'findings_table',
            key: 'findings',
            title: 'Hallazgos y Observaciones',
            type: 'DATA_TABLE',
            description: 'Lista detallada de anomalías detectadas',
            dataSource: 'findings',
            layout: { breakPageBefore: true }
        },
        {
            id: 'risk_assessment_text',
            key: 'risk_assessment',
            title: 'Evaluación de Riesgos',
            type: 'TEXT',
            dataSource: 'riskText'
        },
        {
            id: 'recommendations_text',
            key: 'recommendations',
            title: 'Recomendaciones y Próximos Pasos',
            type: 'TEXT',
            dataSource: 'recommendations',
            layout: { compact: true }
        }
    ]
};
