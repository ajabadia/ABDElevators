import { TranslationService } from '../src/lib/translation-service';
import { redis } from '../src/lib/redis';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
    console.log('🔍 Verifying Dynamic i18n Governance...');

    const locale = 'es';
    const testKey = 'hero.title';
    const testValue = 'Elevadores del Futuro (Test)';

    try {
        // 1. Clear cache
        const keys = await redis.keys('i18n:*');
        if (keys.length > 0) await redis.del(...keys);
        console.log('✅ Cache cleared');

        // 2. Update global message (platform_master)
        await TranslationService.updateTranslation({
            key: testKey,
            value: testValue,
            locale,
            tenantId: 'platform_master'
        });
        console.log(`✅ Global message updated: ${testKey} -> ${testValue}`);

        // 3. Get messages for anonymous user (should be platform_master)
        const messages = await TranslationService.getMessages(locale);
        if (messages.hero?.title === testValue) {
            console.log('✅ Anonymous retrieval SUCCESS');
        } else {
            console.error('❌ Anonymous retrieval FAILED', messages.hero?.title);
        }

        // 4. Create tenant override
        const tenantId = 'tenant_test_123';
        const overrideValue = 'Elevadores Super Especiales (Override)';
        await TranslationService.updateTranslation({
            key: testKey,
            value: overrideValue,
            locale,
            tenantId
        });
        console.log(`✅ Tenant override created for ${tenantId}`);

        // 5. Get messages for tenant
        const tenantMessages = await TranslationService.getMessages(locale, tenantId);
        if (tenantMessages.hero?.title === overrideValue) {
            console.log('✅ Tenant override retrieval SUCCESS');
        } else {
            console.error('❌ Tenant override retrieval FAILED', tenantMessages.hero?.title);
        }

        // 6. Verify global didn't change for others
        const messagesAgain = await TranslationService.getMessages(locale, 'other_tenant');
        if (messagesAgain.hero?.title === testValue) {
            console.log('✅ Isolation (no leak) SUCCESS');
        } else {
            console.error('❌ Isolation FAILED', messagesAgain.hero?.title);
        }

    } catch (error) {
        console.error('❌ Verification CRASHED:', error);
    } finally {
        process.exit(0);
    }
}

verify();
