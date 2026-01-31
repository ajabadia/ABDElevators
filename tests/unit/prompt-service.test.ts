/**
 * @jest-environment node
 */
import { PromptService } from "../../src/lib/prompt-service";
import { getTenantCollection } from "../../src/lib/db-tenant";
import { logEvento } from "../../src/lib/logger";
import { ObjectId } from "mongodb";
import { AppError } from "../../src/lib/errors";

jest.mock("../../src/lib/db-tenant", () => ({
    getTenantCollection: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined),
}));

describe("PromptService", () => {
    const mockTenantId = "tenant_123";
    const mockPromptId = new ObjectId();

    const mockPrompt = {
        _id: mockPromptId,
        key: "TEST_PROMPT",
        name: "Test Prompt",
        template: "Hello {{name}}!",
        variables: [
            { name: "name", type: "string", required: true }
        ],
        model: "gemini-3-flash-preview",
        version: 1,
        active: true,
        tenantId: mockTenantId,
        category: "GENERAL"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getPrompt", () => {
        it("should return a prompt if found and active", async () => {
            const mockFindOne = jest.fn().mockResolvedValue(mockPrompt);
            // SecureCollection mock should have findOne directly
            (getTenantCollection as any).mockResolvedValue({
                findOne: mockFindOne,
                tenantId: mockTenantId
            });

            const result = await PromptService.getPrompt("TEST_PROMPT", mockTenantId);

            expect(result.key).toBe("TEST_PROMPT");
            expect(mockFindOne).toHaveBeenCalledWith({
                key: "TEST_PROMPT",
                tenantId: mockTenantId,
                active: true
            });
        });

        it("should throw NOT_FOUND if prompt does not exist", async () => {
            const mockFindOne = jest.fn().mockResolvedValue(null);
            (getTenantCollection as any).mockResolvedValue({
                findOne: mockFindOne,
                tenantId: mockTenantId
            });

            await expect(PromptService.getPrompt("UNKNOWN", mockTenantId))
                .rejects.toThrow(AppError);
        });
    });

    describe("getRenderedPrompt", () => {
        it("should render template with variables", async () => {
            const mockFindOne = jest.fn().mockResolvedValue(mockPrompt);
            const mockUpdateOne = jest.fn().mockResolvedValue({});

            // Note: getPrompt is called first which calls getTenantCollection
            // then getRenderedPrompt calls getTenantCollection again for auditing.
            (getTenantCollection as any).mockResolvedValue({
                findOne: mockFindOne,
                updateOne: mockUpdateOne,
                tenantId: mockTenantId
            });

            const result = await PromptService.getRenderedPrompt(
                "TEST_PROMPT",
                { name: "World" },
                mockTenantId
            );

            expect(result.text).toBe("Hello World!");
            expect(result.model).toBe("gemini-3-flash-preview");
            expect(mockUpdateOne).toHaveBeenCalled(); // Audit usage
        });

        it("should throw if required variables are missing", async () => {
            const mockFindOne = jest.fn().mockResolvedValue(mockPrompt);
            (getTenantCollection as any).mockResolvedValue({
                findOne: mockFindOne,
                tenantId: mockTenantId
            });

            await expect(PromptService.getRenderedPrompt("TEST_PROMPT", {}, mockTenantId))
                .rejects.toThrow(/Variables requeridas faltantes/);
        });
    });

    describe("updatePrompt", () => {
        it("should create a version snapshot and update the prompt", async () => {
            const mockFindOne = jest.fn().mockResolvedValue(mockPrompt);
            const mockInsertOne = jest.fn().mockResolvedValue({});
            const mockUpdateOne = jest.fn().mockResolvedValue({});

            (getTenantCollection as any).mockImplementation(async (name: string) => {
                if (name === 'prompts') {
                    return { findOne: mockFindOne, updateOne: mockUpdateOne, tenantId: mockTenantId };
                }
                if (name === 'prompt_versions') {
                    return { insertOne: mockInsertOne, tenantId: mockTenantId };
                }
            });

            await PromptService.updatePrompt(
                mockPromptId.toString(),
                "New template {{name}}",
                mockPrompt.variables,
                "user_test",
                "Testing update",
                mockTenantId
            );

            expect(mockInsertOne).toHaveBeenCalled(); // Version snapshot
            expect(mockUpdateOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        template: "New template {{name}}",
                        version: 2
                    })
                })
            );
        });

        it("should throw if maxLength is exceeded", async () => {
            const promptWithLimit = { ...mockPrompt, maxLength: 10 };
            const mockFindOne = jest.fn().mockResolvedValue(promptWithLimit);
            (getTenantCollection as any).mockResolvedValue({
                findOne: mockFindOne,
                tenantId: mockTenantId
            });

            await expect(PromptService.updatePrompt(
                mockPromptId.toString(),
                "This template is too long",
                [],
                "user",
                "reason"
            )).rejects.toThrow(/excede el máximo permitido/);
        });
    });
});
