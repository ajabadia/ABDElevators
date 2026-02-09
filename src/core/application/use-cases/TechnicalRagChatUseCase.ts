import { AgenticRAGService } from '@/lib/langgraph-rag';
import { logEvento } from '@/lib/logger';

export interface RagChatInput {
    question: string;
    messages: any[];
    tenantId: string;
    correlationId: string;
}

export class TechnicalRagChatUseCase {
    async execute(input: RagChatInput) {
        const { question, messages, tenantId, correlationId } = input;

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_RAG_CHAT_USE_CASE',
            action: 'QUERY_START',
            message: `Agentic query started: ${question.substring(0, 50)}...`,
            tenantId,
            correlationId
        });

        return await AgenticRAGService.run(question, tenantId, correlationId, messages);
    }

    async *executeStream(input: RagChatInput) {
        const { question, messages, tenantId, correlationId } = input;

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_RAG_CHAT_USE_CASE',
            action: 'QUERY_STREAM_START',
            message: `Agentic stream query started: ${question.substring(0, 50)}...`,
            tenantId,
            correlationId
        });

        const generator = AgenticRAGService.runStream(question, tenantId, correlationId, messages);
        for await (const chunk of generator) {
            yield chunk;
        }
    }
}
