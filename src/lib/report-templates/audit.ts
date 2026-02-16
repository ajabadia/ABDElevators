import { ReportTemplate } from '@/lib/schemas/report-template';

export const AuditReportTemplate: ReportTemplate = {
    id: 'audit-v1',
    type: 'audit',
    name: 'Compliance Audit Report',
    description: 'Regulatory compliance and safety audit',
    version: '1.0.0',
    sections: [
        {
            id: 'audit_scope',
            title: 'Audit Scope',
            type: 'TEXT',
            content: 'Review of safety protocols, maintenance logs, and physical compliance with EN 81-20/50 standards.'
        },
        {
            id: 'compliance_grid',
            title: 'Compliance Checklist',
            type: 'METRICS_GRID',
            dataKey: 'metrics'
        },
        {
            id: 'non_conformities',
            title: 'Non-Conformities',
            type: 'DATA_TABLE',
            dataKey: 'findings',
            config: {
                columns: [
                    { key: 'id', label: 'Ref' },
                    { key: 'description', label: 'Description' },
                    { key: 'severity', label: 'Severity' },
                    { key: 'deadline', label: 'Deadline' }
                ]
            }
        }
    ]
};
