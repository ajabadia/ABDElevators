import { BillingService } from '../src/lib/billing-service';
import { logEvento } from '../src/lib/logger';
import { connectDB } from '../src/lib/db';
import { guardProduction } from '../src/lib/maintenance';

async function main() {
    guardProduction('seed-plans');
    const correlacion_id = crypto.randomUUID();
    console.log(`🚀 Repopulating commercial plans... (ID: ${correlacion_id})`);

    try {
        const result = await BillingService.seedDefaultPlans();

        await logEvento({
            level: 'INFO',
            source: 'CLI_SEED_PLANS',
            action: 'SEED_PLANS_SUCCESS',
            message: `Planes comerciales reinicializados vía CLI`,
            correlationId: correlacion_id,
            details: { insertedCount: result.insertedCount }
        });

        console.log(`✅ Success: ${result.insertedCount} plans inserted.`);
        process.exit(0);
    } catch (error: unknown) {
        console.error('❌ Error seeding plans:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await logEvento({
            level: 'ERROR',
            source: 'CLI_SEED_PLANS',
            action: 'SEED_PLANS_ERROR',
            message: errorMessage,
            correlationId: correlacion_id,
            details: { stack: errorStack }
        });

        process.exit(1);
    }
}

main();
