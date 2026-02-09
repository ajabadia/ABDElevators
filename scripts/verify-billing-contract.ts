
import { TenantService } from '@/lib/tenant-service';
import { QuotaService } from '@/lib/quota-service';
import { PLANS } from '@/lib/plans';
import { connectAuthDB } from '@/lib/db';

async function verifyBillingContract() {
    console.log('--- Verifying Billing Contract Overrides ---');

    const tenantId = 'test-tenant-billing-verify';
    const db = await connectAuthDB();

    // 1. Cleanup & Setup Tenant
    await db.collection('tenants').deleteOne({ tenantId });
    await db.collection('tenants').insertOne({
        tenantId,
        name: 'Test Tenant Billing',
        subscription: {
            tier: 'BASIC',
            status: 'ACTIVE',
            current_period_start: new Date()
        },
        // Start without custom limits
    });

    console.log('1. Tenant created with BASIC tier (1GB Storage Limit)');

    // 2. Check Default Quota
    const quotaDefault = await QuotaService.evaluateQuota(tenantId, 'STORAGE', 0);
    const basicLimit = PLANS.BASIC.limits.storage_bytes;

    if (quotaDefault.limit !== basicLimit) {
        console.error('FAIL: Default limit mismatch', { expected: basicLimit, got: quotaDefault.limit });
        process.exit(1);
    }
    console.log('PASS: Default limit correct', basicLimit);

    // 3. Apply Override (10GB)
    console.log('3. Applying Custom Limit (10GB)...');
    await TenantService.updateConfig(tenantId, {
        customLimits: {
            storage_bytes: 10 * 1024 * 1024 * 1024 // 10GB
        }
    }, { performedBy: 'SystemVerify' });

    // 4. Verify Override
    const quotaOverride = await QuotaService.evaluateQuota(tenantId, 'STORAGE', 0);
    const expectedLimit = 10 * 1024 * 1024 * 1024;

    if (quotaOverride.limit !== expectedLimit) {
        console.error('FAIL: Override limit NOT respected', { expected: expectedLimit, got: quotaOverride.limit });
        process.exit(1);
    }
    console.log('PASS: Custom limit respected', expectedLimit);

    // 5. Verify Unaffected Metric (Tokens)
    const quotaTokens = await QuotaService.evaluateQuota(tenantId, 'TOKENS', 0);
    const basicTokens = PLANS.BASIC.limits.llm_tokens_per_month;

    if (quotaTokens.limit !== basicTokens) {
        console.error('FAIL: Unaffected metric (Tokens) changed incorrectly', { expected: basicTokens, got: quotaTokens.limit });
        process.exit(1);
    }
    console.log('PASS: Unaffected metric remains default', basicTokens);

    console.log('--- Verification SUCCESS ---');

    // Cleanup
    await db.collection('tenants').deleteOne({ tenantId });
}

verifyBillingContract().catch(console.error);
