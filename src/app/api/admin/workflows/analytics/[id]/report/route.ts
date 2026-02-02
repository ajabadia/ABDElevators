import { NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';
import { AppError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { z } from 'zod';

const SearchParamsSchema = z.object({
    days: z.string().optional().transform(v => v ? Number(v) : 30),
});

/**
 * GET /api/admin/workflows/analytics/[id]/report
 * Generates a technical PDF report for a workflow's performance and anomalies.
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    const workflowId = params.id;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No session found');
        }

        const tenantId = session.user.tenantId;
        const userName = session.user.name || session.user.email || 'System User';

        // 1. Validation
        const { searchParams } = new URL(request.url);
        const { days } = SearchParamsSchema.parse({
            days: searchParams.get('days') || undefined
        });

        // 2. Fetch Stats
        const stats = await WorkflowAnalyticsService.getWorkflowStats(workflowId, tenantId, days);

        // 3. Prepare PDF Content (Markdown-like for generateServerPDF)
        let markdownContent = `# Performance Report: Workflow ${workflowId}\n\n`;
        markdownContent += `## Period: Last ${days} days\n`;
        markdownContent += `### Global Metrics\n`;
        markdownContent += `- **Total Executions:** ${stats.kpis.totalExecutions}\n`;
        markdownContent += `- **Success Rate:** ${(stats.kpis.globalSuccessRate * 100).toFixed(1)}%\n`;
        markdownContent += `- **Avg. Global Duration:** ${Math.round(stats.kpis.avgGlobalDuration)}ms\n\n`;

        markdownContent += `## Node Performance Detail\n`;
        stats.nodes.forEach((node: any) => {
            markdownContent += `### Node: ${node.nodeId}\n`;
            markdownContent += `- **Executions:** ${node.count}\n`;
            markdownContent += `- **Avg. Latency:** ${Math.round(node.avgDuration)}ms\n`;
            markdownContent += `- **Error Rate:** ${(node.errorRate * 100).toFixed(1)}%\n\n`;
        });

        // 4. Generate PDF
        const pdfBuffer = await generateServerPDF({
            identifier: workflowId,
            client: `Tenant ${tenantId}`,
            content: markdownContent,
            tenantId,
            date: new Date(),
            technician: userName
        });

        await logEvento({
            level: 'INFO',
            source: 'API_WORKFLOW_REPORT',
            action: 'GENERATE_REPORT',
            message: `Generated PDF report for workflow ${workflowId}`,
            correlationId,
            details: { workflowId, days, duration_ms: Date.now() - startTime }
        });

        // 5. Return PDF Response
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="workflow-report-${workflowId}.pdf"`,
            },
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid parameters', details: error.issues }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_WORKFLOW_REPORT',
            action: 'GENERATE_REPORT_FAILED',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
