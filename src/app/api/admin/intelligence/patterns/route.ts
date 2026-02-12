import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceAnalyticsService } from '@/lib/intelligence-analytics';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import crypto from 'crypto';

// Schema for PATCH moderation
const ModerateSchema = z.object({
    patternId: z.string(),
    action: z.enum(['ARCHIVE', 'EDIT']),
    updates: z.object({
        problemVector: z.string().optional(),
        solutionVector: z.string().optional(),
    }).optional()
});

export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const user = await enforcePermission('intelligence:patterns', 'read');

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'validationCount';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        const result = await IntelligenceAnalyticsService.getPatterns(page, limit, sortBy, sortOrder);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INTELLIGENCE_PATTERNS_GET', correlationId);
    }
}

export async function PATCH(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const user = await enforcePermission('intelligence:patterns', 'update');

        const body = await req.json();
        const validated = ModerateSchema.safeParse(body);
        if (!validated.success) {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid input', validated.error.issues);
        }

        const { patternId, action, updates } = validated.data;

        await IntelligenceAnalyticsService.moderatePattern(patternId, action, updates);

        await logEvento({
            level: 'WARN',
            source: 'ADMIN_INTELLIGENCE',
            action: `PATTERN_${action}`,
            message: `Admin ${(user as any).email} moderated pattern ${patternId}`,
            correlationId,
            tenantId: (user as any).tenantId,
            details: { patternId, action, updates }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INTELLIGENCE_PATTERNS_PATCH', correlationId);
    }
}
