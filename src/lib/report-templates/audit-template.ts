import { ReportTemplate } from '../schemas/report-template';

export const AuditReportTemplate: ReportTemplate = {
    id: 'tpl_audit_v1',
    name: 'Informe de Auditoría y Cumplimiento',
    type: 'AUDIT',
    version: '1.0.0',
    defaultConfig: {
        primaryColor: '#f59e0b', // Amber 500
        orientation: 'l', // Landscape for wide tables
        includeSources: false
    },
    sections: [
        {
            key: 'compliance_summary',
            title: 'Resumen de Cumplimiento',
            type: 'METRICS_GRID',
            description: 'Estado actual frente a normativas',
            dataSource: 'complianceMetrics',
            layout: { columns: 4 }
        },
        {
            key: 'critical_events',
            title: 'Eventos Críticos del Sistema',
            type: 'DATA_TABLE',
            description: 'Log de acciones administrativas de alto impacto',
            dataSource: 'eventsLog'
        },
        {
            key: 'access_review',
            title: 'Revisión de Accesos',
            type: 'DATA_TABLE',
            description: 'Auditoría de inicios de sesión y permisos',
            dataSource: 'accessLog',
            layout: { breakPageBefore: true }
        },
        {
            key: 'audit_notes',
            title: 'Notas del Auditor',
            type: 'TEXT',
            dataSource: 'auditorNotes'
        }
    ]
};
