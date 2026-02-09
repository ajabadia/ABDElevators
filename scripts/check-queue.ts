
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env.local properly
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function getRedisConnection() {
    let redisUrl = process.env.REDIS_URL;

    if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const host = process.env.UPSTASH_REDIS_REST_URL.replace('https://', '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        redisUrl = `rediss://:${token}@${host}:6379`;
    }

    if (!redisUrl) {
        throw new Error('REDIS_ERROR: REDIS_URL o UPSTASH_REDIS no configurados');
    }

    return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

async function checkQueueStatus() {
    console.log('--- CHECKING BULLMQ QUEUE STATUS ---');
    const connection = getRedisConnection();
    const queue = new Queue('PDF_ANALYSIS', { connection });

    try {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
        console.log('Job Counts:', JSON.stringify(counts, null, 2));

        const activeJobs = await queue.getJobs(['active']);
        if (activeJobs.length > 0) {
            console.log(`\nActive Jobs (${activeJobs.length}):`);
            for (const j of activeJobs) {
                console.log(`- ID: ${j.id}, Data:`, JSON.stringify(j.data, null, 2));
            }
        }

        const waitingJobs = await queue.getJobs(['waiting']);
        if (waitingJobs.length > 0) {
            console.log(`\nWaiting Jobs (${waitingJobs.length}):`);
            waitingJobs.forEach(j => console.log(`- ID: ${j.id}`));
            console.log('\n⚠️ SI HAY TRABAJOS EN WAITING PERO NO EN ACTIVE, EL WORKER NO ESTA CORRIENDO.');
        }

        const failedJobs = await queue.getJobs(['failed']);
        if (failedJobs.length > 0) {
            console.log(`\nFailed Jobs (Last 2):`);
            failedJobs.slice(-2).forEach(j => {
                console.log(`- ID: ${j.id}`);
                console.log(`  Reason: ${j.failedReason}`);
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        await queue.close();
        await connection.quit();
        process.exit();
    }
}

checkQueueStatus();
