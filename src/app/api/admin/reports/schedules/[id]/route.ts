import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { getReportSchedulesCollection } from '@/lib/db-tenant';
import { UpdateReportScheduleSchema } from '@/lib/schemas/report-schedule';
import { ObjectId } from 'mongodb';
import cronParser from 'cron-parser';
import { z } from 'zod';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlationId = `update-sched-${Date.now()}`;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
        }

        const body = await req.json();
        const validated = UpdateReportScheduleSchema.parse(body);

        // If cron changed, recalc nextRun
        let nextRunAt: Date | undefined;
        if (validated.cronExpression) {
            try {
                const interval = (cronParser as any).parseExpression(validated.cronExpression);
                nextRunAt = interval.next().toDate();
            } catch (err) {
                throw new AppError('VALIDATION_ERROR', 400, 'Invalid cron expression');
            }
        }

        const collection = await getReportSchedulesCollection(session);

        const updateData: any = {
            ...validated,
            updatedAt: new Date()
        };

        if (nextRunAt) {
            updateData.nextRunAt = nextRunAt;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Schedule not found');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_SCHEDULES',
            action: 'UPDATE',
            message: `Schedule updated: ${id}`,
            tenantId: session.user.tenantId,
            correlationId,
            details: { updates: Object.keys(validated) }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating schedule:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation Error', details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.status }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const correlationId = `delete-sched-${Date.now()}`;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'User not authenticated');
        }

        const collection = await getReportSchedulesCollection(session);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        // Handle both Soft Delete (UpdateResult) and Hard Delete (DeleteResult)
        const isUpdateResult = 'matchedCount' in result;
        const isDeleteResult = 'deletedCount' in result;

        let found = false;
        if (isUpdateResult) {
            found = (result as any).matchedCount > 0;
        } else if (isDeleteResult) {
            found = (result as any).deletedCount > 0;
        }

        if (!found) {
            throw new AppError('NOT_FOUND', 404, 'Schedule not found');
        }

        await logEvento({
            level: 'INFO',
            source: 'API_SCHEDULES',
            action: 'DELETE',
            message: `Schedule deleted: ${id}`,
            tenantId: session.user.tenantId,
            correlationId
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting schedule:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.status }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
