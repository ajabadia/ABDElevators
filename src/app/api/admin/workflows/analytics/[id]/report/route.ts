import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { handleApiError } from '@/lib/errors';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { z } from 'zod';
import { enforcePermission } from '@/lib/guardian-guard';

const SearchParamsSchema = z.object({
    days: z.string().optional().transform(v => v ? Number(v) : 30),
});

/**
 * GET /api/admin/workflows/analytics/[id]/report
 * Generates a technical PDF report for a workflow's performance and anomalies.
 */
async function GET_internal(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:metrics', 'read');
        const { id: workflowId } = context.params;
        const tenantId = session.user.tenantId;
        const userName = session.user.name || session.user.email || 'System';

        const { searchParams } = new URL(request.url);
        const { days } = SearchParamsSchema.parse({ days: searchParams.get('days') || undefined });

        const stats = await WorkflowAnalyticsService.getWorkflowStats(workflowId, tenantId, days);

        let markdownContent = `# Performance Report: Workflow ${workflowId}\n\n`;
        const kpis = stats.kpis as any;
        markdownContent += `## Period: Last ${days} days\n`;
        markdownContent += `- **Total Executions:** ${kpis.totalExecutions || 0}\n`;
        markdownContent += `- **Success Rate:** ${((kpis.globalSuccessRate || 0) * 100).toFixed(1)}%\n\n`;

        const pdfBuffer = await generateServerPDF({
            identifier: workflowId, client: `Tenant ${tenantId}`, content: markdownContent, tenantId, technician: userName,
            date: new Date()
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="workflow-report-${workflowId}.pdf"`,
            },
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_WORKFLOW_REPORT', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/analytics/[id]/report', thresholdMs: 1000 });
