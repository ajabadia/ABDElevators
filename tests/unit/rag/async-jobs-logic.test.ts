import { AsyncJobsLogic } from "@/lib/async-jobs-logic";
import { PDFIngestionPipeline } from "@/services/infra/pdf/PDFIngestionPipeline";
import { analyzeEntityWithGemini } from "@/services/llm/llm-service";
import { performTechnicalSearch } from "@abd/rag-engine/server";
import { RiskService } from "@/services/security/RiskService";
import { FederatedKnowledgeService } from "@/services/core/FederatedKnowledgeService";
import { getTenantCollection } from "@/lib/db-tenant";
import { ObjectId } from "mongodb";

// Mock dependencies
jest.mock("@/services/infra/pdf/PDFIngestionPipeline", () => ({
    PDFIngestionPipeline: {
        runPipeline: jest.fn(),
    },
}));

jest.mock("@/services/llm/llm-service", () => ({
    analyzeEntityWithGemini: jest.fn(),
}));

jest.mock("@abd/rag-engine/server", () => ({
    performTechnicalSearch: jest.fn(),
}));

jest.mock("@/services/security/RiskService", () => ({
    RiskService: {
        analyzeRisks: jest.fn(),
    },
}));

jest.mock("@/services/core/FederatedKnowledgeService", () => ({
    FederatedKnowledgeService: {
        searchGlobalPatterns: jest.fn(),
    },
}));

jest.mock("@/lib/db-tenant", () => ({
    getTenantCollection: jest.fn(),
}));

jest.mock("@/lib/mappers", () => ({
    mapEntityToCase: jest.fn().mockReturnValue({}),
}));

describe("AsyncJobsLogic Unit Tests", () => {
    const mockUpdateProgress = jest.fn().mockResolvedValue(undefined);
    const mockJobData = {
        tenantId: "tenant_123",
        userId: "user_456",
        data: {
            entityId: new ObjectId().toString(),
            fileBuffer: Buffer.from("test").toString("base64"),
            filename: "test.pdf",
            industry: "ELEVATORS"
        },
        correlationId: "cid_123"
    };

    const mockCollection = {
        updateOne: jest.fn().mockResolvedValue({}),
        findOne: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getTenantCollection as jest.Mock).mockResolvedValue(mockCollection);
    });

    it("should process PDF analysis successfully", async () => {
        // Mocking stages
        (PDFIngestionPipeline.runPipeline as jest.Mock).mockResolvedValue({ cleanedText: "extracted text" });
        (analyzeEntityWithGemini as jest.Mock).mockResolvedValue([{ type: "motor", model: "M1" }]);
        (performTechnicalSearch as jest.Mock).mockResolvedValue([{ text: "rag context" }]);
        (FederatedKnowledgeService.searchGlobalPatterns as jest.Mock).mockResolvedValue(["insight 1"]);
        (RiskService.analyzeRisks as jest.Mock).mockResolvedValue([{ type: "impact", level: "HIGH" }]);
        mockCollection.findOne.mockResolvedValue({ _id: new ObjectId() });

        const result = await AsyncJobsLogic.processPdfAnalysis(mockJobData, "job_1", mockUpdateProgress);

        expect(result.success).toBe(true);
        expect(mockUpdateProgress).toHaveBeenCalledWith(100);
        expect(mockCollection.updateOne).toHaveBeenCalled();
    });

    it("should handle fatal errors and update entity status", async () => {
        const error = new Error("Pipeline failure");
        (PDFIngestionPipeline.runPipeline as jest.Mock).mockRejectedValue(error);

        await expect(AsyncJobsLogic.processPdfAnalysis(mockJobData, "job_1", mockUpdateProgress))
            .rejects.toThrow("Pipeline failure");

        expect(mockCollection.updateOne).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                $set: expect.objectContaining({ status: "error" })
            })
        );
    });
});
