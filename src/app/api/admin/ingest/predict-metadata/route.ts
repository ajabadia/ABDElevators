import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { requirePermission } from '@/lib/auth';
import { handleApiError } from "@/lib/errors";
import { getTenantCollection } from "@/lib/db-tenant";
import { withPerformanceSLA } from "@/lib/interceptors/performance-interceptor";

const PredictMetadataSchema = z.object({
    filename: z.string().min(1),
});

const PredictionOutputSchema = z.object({
    documentTypeId: z.string(),
    industry: z.enum(["ELEVATORS", "REAL_ESTATE", "GENERIC"]),
    confidence: z.number(),
    reasoning: z.string(),
});

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission("platform:ingest", "manage");
        const body = await req.json();
        const { filename } = PredictMetadataSchema.parse(body);

        const tenantId = session.user.tenantId;

        // Fetch available document types to provide as context
        const docTypesCol = await getTenantCollection("document_types", session);
        const docTypes = await docTypesCol.find({ isActive: true });

        const docTypesContext = docTypes.map(t => `${t.name} (ID: ${t._id})`).join(", ");

        const prediction = await PromptRunner.runJson({
            key: "INGEST_PREDICT_METADATA",
            variables: {
                filename,
                documentTypes: docTypesContext,
            },
            schema: PredictionOutputSchema,
            tenantId,
            correlationId,
            session,
        });

        return NextResponse.json({ success: true, prediction });
    } catch (error: unknown) {
        return handleApiError(error, "API_INGEST_PREDICT", correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, {
    endpoint: "POST /api/admin/ingest/predict-metadata",
    thresholdMs: 2000
});
