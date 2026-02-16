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
