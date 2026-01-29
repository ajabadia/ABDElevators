import { logEvento } from '@/lib/logger';
import { PerformanceGuard, StressTestResult } from './performance-guard';

/**
 * InfrastructureAutoscaler: Ajusta dinámicamente recursos basados en métricas de KIMI.
 * (Fase AI Infrastructure Scaling)
 */
export class InfrastructureAutoscaler {
    private static instance: InfrastructureAutoscaler;
    private currentTier: 'standard' | 'high_perf' | 'extreme' = 'standard';

    private constructor() { }

    public static getInstance(): InfrastructureAutoscaler {
        if (!InfrastructureAutoscaler.instance) {
            InfrastructureAutoscaler.instance = new InfrastructureAutoscaler();
        }
        return InfrastructureAutoscaler.instance;
    }

    /**
     * Evalúa métricas y ajusta recursos.
     */
    public async evaluateAndScale(metrics: StressTestResult, correlacion_id: string) {
        let targetTier = this.currentTier;

        if (metrics.p95Latency > 200 || metrics.cpuPeak > 70) {
            targetTier = 'extreme';
        } else if (metrics.p95Latency > 100 || metrics.cpuPeak > 40) {
            targetTier = 'high_perf';
        } else {
            targetTier = 'standard';
        }

        if (targetTier !== this.currentTier) {
            await this.applyScaling(targetTier, correlacion_id);
        }
    }

    private async applyScaling(tier: string, correlacion_id: string) {
        // En un entorno real llamaría a APIs de Vercel, AWS o MongoDB Atlas
        console.log(`[Autoscaler] Escalando infraestructura a TIER: ${tier.toUpperCase()}`);

        await logEvento({
            nivel: 'WARN',
            origen: 'INFRA_AUTOSCALER',
            accion: 'SCALING_OPERATION',
            mensaje: `KIMI ha decidido escalar la infraestructura a nivel: ${tier}`,
            correlacion_id,
            detalles: { previousTier: this.currentTier, newTier: tier }
        });

        this.currentTier = tier as any;
    }

    public getCurrentStatus() {
        return {
            tier: this.currentTier,
            isOptimized: true,
            lastScaling: new Date()
        };
    }
}
