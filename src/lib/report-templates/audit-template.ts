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
            id: 'compliance_summary_grid',
            key: 'compliance_summary',
            title: 'Resumen de Cumplimiento',
            type: 'METRICS_GRID',
            description: 'Estado actual frente a normativas',
            dataSource: 'complianceMetrics',
            layout: { columns: 4 }
        },
        {
            id: 'critical_events_table',
            key: 'critical_events',
            title: 'Eventos Críticos del Sistema',
            type: 'DATA_TABLE',
            description: 'Log de acciones administrativas de alto impacto',
            dataSource: 'eventsLog'
        },
        { id: 'full_logs_table', key: 'full_logs', title: 'Detalle Completo', type: 'DATA_TABLE', description: 'Trazas de auditoría crudas.', dataSource: 'audit_full_logs', layout: { breakPageBefore: true } },
        {
            id: 'access_review_table',
            key: 'access_review',
            title: 'Revisión de Accesos',
            type: 'DATA_TABLE',
            description: 'Auditoría de inicios de sesión y permisos',
            dataSource: 'accessLog',
            layout: { breakPageBefore: true }
        },
        { id: 'summary_grid', key: 'summary', title: 'Resumen Ejecutivo', type: 'METRICS_GRID', description: 'Métricas clave de auditoría...', dataSource: 'audit_summary', layout: { columns: 3 } },
        {
            id: 'audit_notes_text',
            key: 'audit_notes',
            title: 'Notas del Auditor',
            type: 'TEXT',
            dataSource: 'auditorNotes'
        }
    ]
};
