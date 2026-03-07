/**
 * Load Test Script for ABD RAG Platform
 * Phase 300: ERA 13 Consolidation & Stress Test
 * 
 * Purpose: Fire N concurrent requests to critical API endpoints
 * to validate MongoDB pool behavior under burst traffic.
 * 
 * Usage:
 *   npx tsx scripts/tooling/load-test.ts [--concurrency=10] [--rounds=5] [--base-url=http://localhost:3000]
 * 
 * Requires: A running dev server and valid CRON_SECRET in .env.local
 */

const DEFAULT_CONCURRENCY = 10;
const DEFAULT_ROUNDS = 5;
const DEFAULT_BASE_URL = 'http://localhost:3000';

interface TestResult {
    endpoint: string;
    statusCode: number;
    durationMs: number;
    error?: string;
}

interface TestSummary {
    endpoint: string;
    totalRequests: number;
    successCount: number;
    errorCount: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    avgMs: number;
    maxMs: number;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): { concurrency: number; rounds: number; baseUrl: string } {
    const args = process.argv.slice(2);
    let concurrency = DEFAULT_CONCURRENCY;
    let rounds = DEFAULT_ROUNDS;
    let baseUrl = DEFAULT_BASE_URL;

    for (const arg of args) {
        if (arg.startsWith('--concurrency=')) concurrency = parseInt(arg.split('=')[1], 10);
        if (arg.startsWith('--rounds=')) rounds = parseInt(arg.split('=')[1], 10);
        if (arg.startsWith('--base-url=')) baseUrl = arg.split('=')[1];
    }

    return { concurrency, rounds, baseUrl };
}

/**
 * Fire a single timed request
 */
async function timedFetch(url: string, options?: RequestInit): Promise<TestResult> {
    const start = Date.now();
    try {
        const res = await fetch(url, options);
        return {
            endpoint: url,
            statusCode: res.status,
            durationMs: Date.now() - start,
        };
    } catch (error: unknown) {
        return {
            endpoint: url,
            statusCode: 0,
            durationMs: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sorted: number[], p: number): number {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

/**
 * Summarize results for an endpoint
 */
function summarize(endpoint: string, results: TestResult[]): TestSummary {
    const durations = results.map(r => r.durationMs).sort((a, b) => a - b);
    const successCount = results.filter(r => r.statusCode >= 200 && r.statusCode < 500).length;

    return {
        endpoint,
        totalRequests: results.length,
        successCount,
        errorCount: results.length - successCount,
        p50Ms: percentile(durations, 50),
        p95Ms: percentile(durations, 95),
        p99Ms: percentile(durations, 99),
        avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        maxMs: durations[durations.length - 1],
    };
}

/**
 * Main load test runner
 */
async function main(): Promise<void> {
    const { concurrency, rounds, baseUrl } = parseArgs();
    const totalRequests = concurrency * rounds;

    console.log('═══════════════════════════════════════════════════');
    console.log('  ABD RAG Platform — Load Test (Phase 300)');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Base URL:    ${baseUrl}`);
    console.log(`  Concurrency: ${concurrency}`);
    console.log(`  Rounds:      ${rounds}`);
    console.log(`  Total Reqs:  ${totalRequests} per endpoint`);
    console.log('═══════════════════════════════════════════════════\n');

    const endpoints = [
        {
            name: 'GET /api/admin/dashboard/now',
            url: `${baseUrl}/api/admin/dashboard/now`,
            options: { method: 'GET' } as RequestInit,
        },
        {
            name: 'GET /api/admin/stats',
            url: `${baseUrl}/api/admin/stats`,
            options: { method: 'GET' } as RequestInit,
        },
    ];

    const allSummaries: TestSummary[] = [];

    for (const ep of endpoints) {
        console.log(`\n🔥 Testing: ${ep.name}`);
        console.log(`   Firing ${totalRequests} requests (${concurrency} concurrent × ${rounds} rounds)...`);

        const results: TestResult[] = [];

        for (let round = 0; round < rounds; round++) {
            const batch = Array.from({ length: concurrency }, () =>
                timedFetch(ep.url, ep.options)
            );
            const batchResults = await Promise.all(batch);
            results.push(...batchResults);

            const roundErrors = batchResults.filter(r => r.statusCode === 0 || r.statusCode >= 500).length;
            const roundAvg = Math.round(batchResults.reduce((a, r) => a + r.durationMs, 0) / batchResults.length);
            console.log(`   Round ${round + 1}/${rounds}: avg=${roundAvg}ms, errors=${roundErrors}`);
        }

        const summary = summarize(ep.name, results);
        allSummaries.push(summary);
    }

    // Print final report
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('  RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════');

    for (const s of allSummaries) {
        const status = s.errorCount === 0 ? '✅ PASS' : '⚠️ ERRORS';
        console.log(`\n  ${status} ${s.endpoint}`);
        console.log(`    Requests: ${s.totalRequests} (${s.successCount} ok, ${s.errorCount} errors)`);
        console.log(`    Latency:  avg=${s.avgMs}ms  p50=${s.p50Ms}ms  p95=${s.p95Ms}ms  p99=${s.p99Ms}ms  max=${s.maxMs}ms`);

        if (s.p95Ms > 2000) {
            console.log(`    ❌ P95 EXCEEDS 2000ms SLA — MongoDB pool may be saturated`);
        } else if (s.p95Ms > 500) {
            console.log(`    ⚠️ P95 above 500ms — Monitor in production`);
        } else {
            console.log(`    ✅ P95 within SLA`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════');

    // Exit with error code if any endpoint had errors
    const hasErrors = allSummaries.some(s => s.errorCount > 0);
    process.exit(hasErrors ? 1 : 0);
}

main().catch((err: unknown) => {
    console.error('Fatal error in load test:', err);
    process.exit(1);
});
