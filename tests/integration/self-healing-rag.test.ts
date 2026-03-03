/**
 * @jest-environment node
 */

jest.mock("@/services/core/rag/fact-checker-service");
jest.mock("@/services/llm/llm-service");
jest.mock("@/services/ops/AnomalyDetectionService");
jest.mock("@abd/rag-engine/server", () => ({
    hybridSearch: jest.fn().mockResolvedValue([]),
    performTechnicalSearch: jest.fn().mockResolvedValue([]),
    truncateContext: jest.fn().mockImplementation((p, h, d) => ({ chunks: d }))
}));
jest.mock("@/services/llm/prompt-service", () => ({
    PromptService: {
        getRenderedPrompt: jest.fn().mockImplementation((key, data) => {
            let text = `PROMPT_KEY:${key}`;
            if (key === 'CHAT_RAG_GENERATOR' || key === 'RAG_GENERATOR') {
                text += ` | {{context}} | QUERY:${data.question}`;
            }
            return Promise.resolve({ text, model: "gemini-pro" });
        })
    }
}));
jest.mock("@/services/core/rag-evaluation-service", () => ({
    RagEvaluationService: {
        evaluateQuery: jest.fn().mockResolvedValue(undefined)
    }
}));
jest.mock("@/lib/auth", () => ({
    auth: jest.fn()
}));
jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

import { AgenticRAGService } from "@/lib/langgraph-rag";
import { FactCheckerService } from "@/services/core/rag/fact-checker-service";
import { callGeminiMini } from "@/services/llm/llm-service";
import { AnomalyDetectionService } from "@/services/ops/AnomalyDetectionService";

describe("AgenticRAGService - Self-Healing Integration", () => {
    const mockTenantId = "tenant_123";
    const mockCorrelationId = "corr_456";

    beforeEach(() => {
        jest.clearAllMocks();

        // 🤖 Smart Mock for callGeminiMini
        (callGeminiMini as jest.Mock).mockImplementation((prompt: string) => {
            if (prompt.includes('RAG_RELEVANCE_GRADER')) return Promise.resolve('{"score": "yes"}');
            if (prompt.includes('RAG_ANSWER_GRADER')) return Promise.resolve('{"score": "yes"}');
            if (prompt.includes('CHAT_RAG_GENERATOR') || prompt.includes('RAG_GENERATOR')) {
                if (prompt.includes('[REPARACIÓN ACTIVA]')) {
                    return Promise.resolve("Respuesta corregida");
                }
                return Promise.resolve("Respuesta con alucinación");
            }
            return Promise.resolve('{}');
        });
    });

    it("should detect hallucination, report it, and self-heal", async () => {
        // Mock FactChecker to fail first time, succeed second
        (FactCheckerService.verify as jest.Mock)
            .mockResolvedValueOnce({
                isReliable: false,
                hallucinationScore: 0.8,
                details: [{ claim: "error factual", verified: false }]
            })
            .mockResolvedValueOnce({
                isReliable: true,
                hallucinationScore: 0.05,
                details: [{ claim: "dato real", verified: true }]
            });

        const result = await AgenticRAGService.run(
            "test query",
            mockTenantId,
            mockCorrelationId,
            [{ role: 'user', content: 'hello' }],
            "ELEVATORS"
        );

        console.log("DEBUG_RESULT:", JSON.stringify({
            is_self_healed: result.is_self_healed,
            hallucination_score: result.hallucination_score,
            is_grounded: result.is_grounded,
            generation: result.generation
        }));

        // Assertions
        expect(result.is_self_healed).toBe(true);
        expect(result.generation).toBe("Respuesta corregida");
        expect(result.hallucination_score).toBe(0.05); // Final score

        expect(AnomalyDetectionService.reportHallucination).toHaveBeenCalledWith(
            mockTenantId,
            mockCorrelationId,
            "test query",
            0.8,
            expect.any(Array)
        );

        // Check for specific trace message
        expect(result.trace).toContain(expect.stringContaining("(Self-Healing Mode)"));
    });

    it("should avoid self-healing if response is already grounded", async () => {
        // Smart mock will return "Respuesta con alucinación" but FactChecker says it's reliable
        (FactCheckerService.verify as jest.Mock).mockResolvedValueOnce({
            isReliable: true,
            hallucinationScore: 0.1,
            details: [{ claim: "dato real", verified: true }]
        });

        const result = await AgenticRAGService.run(
            "solid query",
            mockTenantId,
            mockCorrelationId,
            [],
            "ELEVATORS"
        );

        expect(result.is_self_healed).toBe(false);
        expect(result.generation).toBe("Respuesta con alucinación");
        expect(AnomalyDetectionService.reportHallucination).not.toHaveBeenCalled();
    });
});
