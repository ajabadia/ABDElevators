import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ReportScheduleService } from '@/services/ops/report-schedule-service';
import { CreateReportScheduleSchema } from '@/lib/schemas/report-schedule';
import { z } from 'zod';

async function GET_internal (req: NextRequest) {
    const correlationId = `list-sched-${Date.now()}`;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
        }

        const schedules = await ReportScheduleService.listSchedules(session);

        return NextResponse.json(schedules);

    } catch (error: any) {
        console.error('Error listing schedules:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: error.status || 500 }
        );
    }
}

async function POST_internal (req: NextRequest) {
    const correlationId = `create-sched-${Date.now()}`;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
        }

        const body = await req.json();
        const id = await ReportScheduleService.createSchedule(session, body);

        return NextResponse.json({ success: true, id }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating schedule:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation Error', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: error.status || 500 }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/reports/schedules', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/reports/schedules', thresholdMs: 1000 });
