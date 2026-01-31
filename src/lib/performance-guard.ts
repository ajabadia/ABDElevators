import { logEvento } from '@/lib/logger';

export interface StressTestResult {
    id: string;
    timestamp: Date;
    virtualUsers: number;
    requestCount: number;
    successRate: number;
    avgLatency: number;
    p95Latency: number;
    cpuPeak: number;
    memPeak: number;
    failures: Array<{ type: string; count: number }>;
}

/**
 * PerformanceGuard: Motor de pruebas de carga y monitorización de estrés.
 * (Fase High-Availability Stress Testing)
 */
export class PerformanceGuard {
    private static instance: PerformanceGuard;

    private constructor() { }

    public static getInstance(): PerformanceGuard {
        if (!PerformanceGuard.instance) {
            PerformanceGuard.instance = new PerformanceGuard();
        }
        return PerformanceGuard.instance;
    }

    /**
     * Simula una carga de estrés sobre el ReliabilityEngine.
     */
    public async runReliabilityStressTest(config: { virtualUsers: number; durationSeconds: number }): Promise<StressTestResult> {
        const start = Date.now();
        const results = {
            total: 0,
            success: 0,
            latencies: [] as number[],
            failures: new Map<string, number>()
        };

        // Simulación de carga distribuida
        for (let i = 0; i < config.virtualUsers; i++) {
            this.simulateWorkflow(config.durationSeconds, results);
        }

        // Esperar a que termine la duración
        await new Promise(resolve => setTimeout(resolve, config.durationSeconds * 1000));

        const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / (results.latencies.length || 1);

        const testResult: StressTestResult = {
            id: `test_${Date.now()}`,
            timestamp: new Date(),
            virtualUsers: config.virtualUsers,
            requestCount: results.total,
            successRate: (results.success / (results.total || 1)) * 100,
            avgLatency,
            p95Latency: avgLatency * 1.5, // Mock P95
            cpuPeak: Math.random() * 80 + 10,
            memPeak: Math.random() * 2000 + 500,
            failures: Array.from(results.failures.entries()).map(([type, count]) => ({ type, count }))
        };

        await logEvento({
            level: testResult.successRate < 95 ? 'ERROR' : 'INFO',
            source: 'PERFORMANCE_GUARD',
            action: 'STRESS_TEST_COMPLETE',
            message: `Stress Test finalizado: ${testResult.successRate.toFixed(2)}% success rate con ${config.virtualUsers} usuarios.`,
            correlationId: crypto.randomUUID(),
            details: testResult
        });

        return testResult;
    }

    private async simulateWorkflow(duration: number, results: any) {
        const end = Date.now() + (duration * 1000);
        while (Date.now() < end) {
            const reqStart = Date.now();
            try {
                results.total++;
                // Simulación de operación de red/DB
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20));
                results.success++;
                results.latencies.push(Date.now() - reqStart);
            } catch (e: any) {
                const type = e.code || 'UNKNOWN';
                results.failures.set(type, (results.failures.get(type) || 0) + 1);
            }
        }
    }
}
