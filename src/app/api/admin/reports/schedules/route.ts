import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { ReportScheduleService } from '@/services/ops/report-schedule-service';
import { z } from 'zod';

async function GET_internal(req: NextRequest) {
    const correlationId = `list-sched-${Date.now()}`;

    try {
        const session = await requirePermission('reports:schedule', 'read');
        const schedules = await ReportScheduleService.listSchedules(session);

        return NextResponse.json(schedules);

    } catch (error: unknown) {
        console.error('Error listing schedules:', error);
        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}

async function POST_internal(req: NextRequest) {
    const correlationId = `create-sched-${Date.now()}`;

    try {
        const session = await requirePermission('reports:schedule', 'write');

        const body = await req.json();
        const id = await ReportScheduleService.createSchedule(session, body);

        return NextResponse.json({ success: true, id }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error creating schedule:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation Error', details: error.issues },
                { status: 400 }
            );
        }

        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/reports/schedules', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/reports/schedules', thresholdMs: 1000 });
