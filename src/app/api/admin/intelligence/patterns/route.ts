
import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceAnalyticsService } from '@/lib/intelligence-analytics';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

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
    try {
        const session = await auth();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'validationCount';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

        const result = await IntelligenceAnalyticsService.getPatterns(page, limit, sortBy, sortOrder);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API INTELLIGENCE PATTERNS]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const validated = ModerateSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: 'Invalid input', details: validated.error.issues }, { status: 400 });
        }

        const { patternId, action, updates } = validated.data;

        await IntelligenceAnalyticsService.moderatePattern(patternId, action, updates);

        await logEvento({
            level: 'WARN',
            source: 'ADMIN_INTELLIGENCE',
            action: `PATTERN_${action}`,
            message: `Admin ${session.user.email} moderated pattern ${patternId}`,
            correlationId: 'admin-action',
            tenantId: session.user.tenantId,
            details: { patternId, action, updates }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API INTELLIGENCE MODERATE]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
