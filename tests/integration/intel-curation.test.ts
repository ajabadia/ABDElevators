/**
 * @jest-environment node
 */

jest.mock("@/services/ops/AnomalyDetectionService", () => ({
    AnomalyDetectionService: {
        reportRetrievalFailure: jest.fn().mockReturnValue(Promise.resolve({}))
    }
}));
jest.mock("@/services/llm/llm-service");
jest.mock("@/lib/auth", () => ({
    auth: jest.fn()
}));
jest.mock("@abd/rag-engine/server", () => ({
    hybridSearch: jest.fn(),
    performTechnicalSearch: jest.fn(),
    truncateContext: jest.fn().mockImplementation((prompt, history, chunks) => ({ chunks }))
}));
jest.mock("@/services/core/rag-evaluation-service", () => ({
    RagEvaluationService: {
        evaluateQuery: jest.fn().mockResolvedValue({})
    }
}));
jest.mock("@/services/core/rag/fact-checker-service", () => ({
    FactCheckerService: {
        verify: jest.fn().mockResolvedValue({
            isReliable: true,
            hallucinationScore: 0,
            details: []
        })
    }
}));
jest.mock("@/services/llm/prompt-service", () => ({
    PromptService: {
        getRenderedPrompt: jest.fn().mockResolvedValue({
            text: "Mocked prompt: {{question}} and {{context}}",
            model: "gemini-1.5-pro"
        })
    }
}));

import { AgenticRAGService } from "@/lib/langgraph-rag";
import { AnomalyDetectionService } from "@/services/ops/AnomalyDetectionService";
import { hybridSearch } from "@abd/rag-engine/server";
import { callGeminiMini } from "@/services/llm/llm-service";

describe("Phase 255: Intel-Driven Curation Integrations", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Phase 255.2: Retrieval Quality Monitoring", () => {
        it("should call reportRetrievalFailure if hybridSearch returns 0 documents", async () => {
            (AnomalyDetectionService.reportRetrievalFailure as jest.Mock).mockResolvedValue({});

            // Simulate 0 documents found
            (hybridSearch as jest.Mock).mockResolvedValueOnce([]);

            // Mock LLM to return generation
            (callGeminiMini as jest.Mock).mockResolvedValueOnce("No documents were found based on your request.");

            // Also mock rewrite query success
            (callGeminiMini as jest.Mock).mockResolvedValueOnce("Help me rewrite this query");

            await AgenticRAGService.run("How do I fix error E99 on Lift A?", "tenant-123", "corr-123", [], "ELEVATORS");

            // Verify that reportRetrievalFailure was correctly triggered
            expect(AnomalyDetectionService.reportRetrievalFailure).toHaveBeenCalledWith(
                "tenant-123",
                "corr-123",
                "How do I fix error E99 on Lift A?",
                "ELEVATORS"
            );
        });

        it("should NOT call reportRetrievalFailure if hybridSearch returns documents", async () => {
            (AnomalyDetectionService.reportRetrievalFailure as jest.Mock).mockResolvedValue({});

            // Simulate documents found
            (hybridSearch as jest.Mock).mockResolvedValueOnce([{ text: "Fixing E99 requires reboot.", page: 1 }]);

            // Mock LLM to return JSON grade for the gradeDocuments node
            (callGeminiMini as jest.Mock).mockResolvedValueOnce(JSON.stringify({ score: "yes" }));

            // Mock LLM to return generation
            (callGeminiMini as jest.Mock).mockResolvedValueOnce("You should reboot it.");

            // Mock LLM rewrite query
            (callGeminiMini as jest.Mock).mockResolvedValueOnce("Help me rewrite this query again");

            await AgenticRAGService.run("How do I fix error E99 on Lift A?", "tenant-123", "corr-123", [], "ELEVATORS");

            // Verify that reportRetrievalFailure was NOT triggered
            expect(AnomalyDetectionService.reportRetrievalFailure).not.toHaveBeenCalled();
        });
    });
});
