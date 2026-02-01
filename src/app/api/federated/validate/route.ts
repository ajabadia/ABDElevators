
import { NextResponse } from 'next/server';
import { FederatedKnowledgeService } from '@/lib/federated-knowledge-service';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

const ValidateSchema = z.object({
    patternId: z.string().min(1),
});

export async function POST(req: Request) {
    const correlationId = crypto.randomUUID();
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { patternId } = ValidateSchema.parse(body);

        const success = await FederatedKnowledgeService.validatePattern(patternId, session.user.tenantId);

        if (success) {
            await logEvento({
                level: 'INFO',
                source: 'API_FEDERATED',
                action: 'PATTERN_VALIDATED',
                message: `Pattern ${patternId} validated by ${session.user.email}`,
                correlationId,
                tenantId: session.user.tenantId,
                details: { patternId }
            });
            return NextResponse.json({ success: true });
        } else {
            throw new AppError('NOT_FOUND', 404, 'Pattern not found or not published');
        }

    } catch (error) {
        console.error('[FEDERATED VALIDATE ERROR]', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
