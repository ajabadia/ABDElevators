
import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * ScriptBase - Abstract base class for all operational scripts.
 * Ensures consistent env loading, DB connectivity, and logging.
 * Phase 8: High-Impact Polish
 */
export abstract class ScriptBase {
    protected correlationId: string;
    protected db: any;

    constructor(protected scriptName: string) {
        this.correlationId = CorrelationIdService.generate();
    }

    /**
     * Entry point for script execution.
     */
    async run() {
        console.log(`🚀 [${this.scriptName}] Starting execution...`);
        console.log(`🆔 Correlation ID: ${this.correlationId}`);

        try {
            await this.initialize();
            await this.execute();
            await this.cleanup();

            console.log(`✅ [${this.scriptName}] Completed successfully.`);
            process.exit(0);
        } catch (error: any) {
            console.error(`❌ [${this.scriptName}] Fatal error:`, error);

            // Attempt to log failure if it's not a DB error
            try {
                await logEvento({
                    level: 'ERROR',
                    source: `SCRIPT_${this.scriptName.toUpperCase()}`,
                    action: 'EXECUTION_FAILED',
                    message: error.message,
                    correlationId: this.correlationId,
                    details: { stack: error.stack }
                });
            } catch (logErr) {
                // Secondary logging failure
            }

            process.exit(1);
        }
    }

    /**
     * Loads env and connects to DB.
     */
    protected async initialize() {
        const envPath = path.join(process.cwd(), '.env.local');
        dotenv.config({ path: envPath });

        this.db = await connectDB();
        console.log('📡 Database connection established.');
    }

    /**
     * Main script logic to be implemented by subclasses.
     */
    protected abstract execute(): Promise<void>;

    /**
     * Optional cleanup logic.
     */
    protected async cleanup() {
        // Close DB connections if necessary, etc.
    }
}
