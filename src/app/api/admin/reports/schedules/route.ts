import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ReportScheduleService } from '@/lib/services/report-schedule-service';
import { CreateReportScheduleSchema } from '@/lib/schemas/report-schedule';
import { z } from 'zod';

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
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
                { error: 'Validation Error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: error.status || 500 }
        );
    }
}
