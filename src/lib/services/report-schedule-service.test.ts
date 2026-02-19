import { ReportScheduleService } from './report-schedule-service';
import { getTenantCollection } from '@/lib/db-tenant';
import cronParser from 'cron-parser';

// Mock dependencies
jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn()
}));

jest.mock('@/lib/logger', () => ({
    logEvento: jest.fn()
}));

jest.mock('cron-parser', () => ({
    parseExpression: jest.fn()
}));

describe('ReportScheduleService', () => {
    const mockSession = {
        user: {
            id: 'user-123',
            tenantId: 'tenant-abc'
        }
    };

    const mockCollection = {
        insertOne: jest.fn(),
        find: jest.fn(),
        updateOne: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);
        // Reset default return
        mockCollection.find.mockResolvedValue([]);
    });

    describe('createSchedule', () => {
        it('should create a schedule with valid data', async () => {
            const data = {
                name: 'Weekly Report',
                templateType: 'inspection',
                cronExpression: '0 8 * * 1', // Weekly
                recipients: ['test@example.com'],
                enabled: true
            };

            const mockInterval = {
                next: jest.fn().mockReturnValue({ toDate: () => new Date('2026-02-23T08:00:00Z') })
            };
            (cronParser as any).parseExpression.mockReturnValue(mockInterval);

            mockCollection.insertOne.mockResolvedValue({ insertedId: 'sched-123' });

            const result = await ReportScheduleService.createSchedule(mockSession, data);

            expect(result).toBe('sched-123');
            expect(getTenantCollection).toHaveBeenCalledWith('report_schedules', mockSession);
            expect((cronParser as any).parseExpression).toHaveBeenCalledWith(data.cronExpression);
            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Weekly Report',
                tenantId: 'tenant-abc',
                createdBy: 'user-123',
                nextRunAt: new Date('2026-02-23T08:00:00Z')
            }));
        });

        it('should throw error for invalid cron expression', async () => {
            const data = {
                name: 'Bad Cron',
                templateType: 'inspection',
                cronExpression: 'invalid-cron',
                recipients: ['test@example.com']
            };

            (cronParser as any).parseExpression.mockImplementation(() => {
                throw new Error('Invalid cron');
            });

            await expect(ReportScheduleService.createSchedule(mockSession, data))
                .rejects.toThrow('Invalid cron expression');
        });
    });

    describe('listSchedules', () => {
        it('should return list of schedules', async () => {
            const mockSchedules = [{ _id: '1', name: 'Sched 1' }];
            mockCollection.find.mockResolvedValue(mockSchedules);

            const result = await ReportScheduleService.listSchedules(mockSession);

            expect(result).toEqual(mockSchedules);
            expect(mockCollection.find).toHaveBeenCalledWith({});
        });
    });
});
