import { ReportTemplate, ReportTemplateType } from '@/lib/schemas/report-template';
import { InspectionReportTemplate } from './inspection';
import { AuditReportTemplate } from './audit';
import { RagQualityReportTemplate } from './rag-quality';

const templates: Record<string, ReportTemplate> = {
    'inspection': InspectionReportTemplate,
    'audit': AuditReportTemplate,
    'ragQuality': RagQualityReportTemplate,
    // workflow and entityLlm are placeholders for future phases or dynamic generation
    'workflow': { ...InspectionReportTemplate, id: 'workflow-placeholder', type: 'workflow', name: 'Workflow Report' },
    'entityLlm': { ...InspectionReportTemplate, id: 'entity-placeholder', type: 'entityLlm', name: 'Entity Analysis' }
};

export class ReportTemplateRegistry {
    static getTemplateByType(type: ReportTemplateType): ReportTemplate | undefined {
        return templates[type];
    }

    static getAllTemplates(): ReportTemplate[] {
        return Object.values(templates);
    }
}
