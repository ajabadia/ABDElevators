import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { IUsageRepository } from '../../domain/repositories/IUsageRepository';
import { agentEngine } from '@/core/engine/OrderAnalysisEngine';
import { logEvento } from '@/lib/logger';

export interface AnalysisInput {
    id: string;
    tenantId: string;
    correlationId: string;
}

export class ProcessEntityAnalysisUseCase {
    constructor(
        private entityRepo: IEntityRepository,
        private usageRepo: IUsageRepository
    ) { }

    async *executeStream(input: AnalysisInput) {
        const { id, tenantId, correlationId } = input;

        // 1. Quota Check
        await this.usageRepo.checkLimits(tenantId, 'REPORTS');

        // 2. Fetch Entity
        const entity = await this.entityRepo.findById(id, tenantId);
        if (!entity) {
            throw new Error('Entidad no encontrada');
        }

        yield { event: 'status', data: { message: 'Iniciando cerebro agéntico...', node: 'start' } };

        // 3. Agent Execution
        const initialState = {
            messages: [{ role: 'user', content: entity.originalText || '' }],
            pedidoId: id,
            tenantId,
            correlationId
        };

        const thread_id = `analyze_${id}_${Date.now()}`;
        const config = { configurable: { thread_id } };

        const eventStream = await agentEngine.stream(initialState, {
            ...config,
            streamMode: "values"
        });

        let finalState: any = null;
        for await (const update of eventStream) {
            finalState = update;
            const lastMessage = update.messages[update.messages.length - 1];

            yield {
                event: 'trace',
                data: {
                    message: typeof lastMessage === 'string' ? lastMessage : lastMessage?.content || 'Procesando...',
                    confidence: update.confidence_score,
                    findingsCount: update.findings?.length || 0
                }
            };
        }

        // 4. Persistence & Tracking
        if (finalState) {
            const detectedPatterns = (finalState.findings || [])
                .filter((f: any) => f.source === 'extraction')
                .map((f: any) => ({ type: f.type, model: f.model }));

            const riesgos = (finalState.findings || [])
                .filter((f: any) => f.source === 'risk_analysis');

            await this.entityRepo.updateAnalysisResult(id, {
                detectedPatterns,
                metadata: {
                    ...entity.metadata,
                    risks: riesgos,
                },
                status: 'analyzed'
            });

            await this.usageRepo.trackUsage(tenantId, id, 'REPORTS');
        }

        yield {
            event: 'complete',
            data: {
                message: 'Análisis finalizado y guardado con éxito',
                entityId: id,
                correlationId
            }
        };
    }
}
