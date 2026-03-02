import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceService } from '@/services/admin/IntelligenceService';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/performance-sla';
import { z } from 'zod';
import crypto from 'crypto';

const PatternQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20)
});

/**
 * GET /api/admin/intelligence/patterns
 * Lists federated intelligence patterns.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('intelligence:patterns', 'read');

        const { searchParams } = new URL(req.url);
        const validated = PatternQuerySchema.parse(Object.fromEntries(searchParams));

        const result = await IntelligenceService.getPatterns({ limit: validated.limit });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INTELLIGENCE_PATTERNS_GET', correlationId);
    }
}, { p95: 500, max: 2000 });
