import { Document, ObjectId } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import {
    ChecklistConfig,
    ChecklistConfigSchema,
    ExtractedChecklist,
    ExtractedChecklistSchema
} from '@/lib/schemas/checklist';
import { AppError } from '@/lib/errors';

/**
 * FormBuilderService
 * Universal service for building and managing dynamic forms.
 * Reuses the infrastructure of the Checklist Engine.
 */
export class FormBuilderService {

    /**
     * Create a new form template.
     */
    static async createFormTemplate(session: TenantSession, data: any): Promise<string> {
        const validated = ChecklistConfigSchema.parse(data);
        const collection = await getTenantCollection<Document>('checklist_configs', session);

        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'FORM_BUILDER',
            action: 'FORM_TEMPLATE_CREATED',
            message: `New form template created: ${validated.title}`,
            tenantId: session.user?.tenantId,
            correlationId: `form-create-${Date.now()}`,
            details: { templateId: result.insertedId.toString(), title: validated.title }
        });

        return result.insertedId.toString();
    }

    /**
     * Get a form template by its ID.
     */
    static async getFormTemplate(session: TenantSession, templateId: string): Promise<ChecklistConfig> {
        const collection = await getTenantCollection<Document>('checklist_configs', session);
        const doc = await collection.findOne({ _id: new ObjectId(templateId) });

        if (!doc) {
            throw new AppError('NOT_FOUND', 404, 'Form template not found');
        }

        return ChecklistConfigSchema.parse(doc);
    }

    /**
     * Submit a form (create a runtime instance/submission).
     */
    static async submitForm(session: TenantSession, submissionData: any): Promise<string> {
        const validated = ExtractedChecklistSchema.parse(submissionData);
        const collection = await getTenantCollection<Document>('document_checklists', session);

        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'FORM_BUILDER',
            action: 'FORM_SUBMITTED',
            message: `Form submitted for entity: ${validated.entityId}`,
            tenantId: session.user?.tenantId,
            correlationId: `form-submit-${Date.now()}`,
            details: { submissionId: result.insertedId.toString(), entityId: validated.entityId }
        });

        return result.insertedId.toString();
    }

    /**
     * List submissions for a specific entity or tenant.
     */
    static async listSubmissions(session: TenantSession, entityId?: string): Promise<ExtractedChecklist[]> {
        const collection = await getTenantCollection<ExtractedChecklist>('document_checklists', session);
        const filter: any = {};
        if (entityId) filter.entityId = entityId;

        return collection.find(filter);
    }
}
