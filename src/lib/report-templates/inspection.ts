import { ReportTemplate } from '@/lib/schemas/report-template';

export const InspectionReportTemplate: ReportTemplate = {
    id: 'inspection-v1',
    type: 'inspection',
    name: 'Technical Inspection Report',
    description: 'Standard elevator technical inspection report',
    version: '1.0.0',
    sections: [
        {
            id: 'summary',
            title: 'Executive Summary',
            type: 'TEXT',
            content: 'This report details the findings of the technical inspection performed on the elevator unit. Overall status and critical recommendations are highlighted below.'
        },
        {
            id: 'equipment_details',
            title: 'Equipment Details',
            type: 'DATA_TABLE',
            dataKey: 'equipment',
            config: {
                columns: [
                    { key: 'component', label: 'Component' },
                    { key: 'status', label: 'Status' },
                    { key: 'notes', label: 'Notes' }
                ]
            }
        },
        {
            id: 'risk_analysis',
            title: 'Risk Analysis',
            type: 'SEVERITY_BADGES',
            dataKey: 'findings'
        },
        {
            id: 'recommendations',
            title: 'Recommendations',
            type: 'LIST',
            dataKey: 'recommendations'
        }
    ]
};
