import { UsageLogSchema, PricingTypeSchema, TenantSubscriptionSchema } from '@/lib/schemas/billing';
import { IngestionStatusEnum } from '@/lib/schemas/knowledge';

describe('🧩 Schemas Validation', () => {

    describe('UsageLogSchema', () => {
        it('should validate a valid usage log', () => {
            const validLog = {
                tenantId: 'tenant-123',
                type: 'LLM_TOKENS',
                value: 500,
                resource: 'gemini-1.5-pro',
                correlationId: 'corr-456',
                timestamp: new Date()
            };
            const result = UsageLogSchema.safeParse(validLog);
            expect(result.success).toBe(true);
        });

        it('should fail if type is invalid', () => {
            const invalidLog = {
                tenantId: 'tenant-123',
                type: 'INVALID_TYPE',
                value: 500,
                resource: 'gemini-1.5-pro'
            };
            const result = UsageLogSchema.safeParse(invalidLog);
            expect(result.success).toBe(false);
        });
    });

    describe('TenantSubscriptionSchema', () => {
        it('should validate default values', () => {
            const minSubscription = {};
            const result = TenantSubscriptionSchema.safeParse(minSubscription);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.planSlug).toBe('FREE');
                expect(result.data.status).toBe('trial');
            }
        });
    });

    describe('IngestionStatusEnum', () => {
        it('should contain expected status values', () => {
            const valid = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
            valid.forEach(v => {
                expect(IngestionStatusEnum.safeParse(v).success).toBe(true);
            });
            expect(IngestionStatusEnum.safeParse('UNKNOWN').success).toBe(false);
        });
    });
});
