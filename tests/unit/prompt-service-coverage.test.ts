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

describe("PromptService Extended Coverage", () => {
    const mockTenantId = "tenant_123";
    const mockPromptId = new ObjectId();

    const mockPrompt = {
        _id: mockPromptId,
        key: "TEST_PROMPT",
        name: "Test Prompt",
        template: "v1 template",
        variables: [],
        model: "gemini-3-flash",
        version: 1,
        active: true,
        tenantId: mockTenantId,
        category: "GENERAL"
    };

    const mockVersionSnapshot = {
        _id: new ObjectId(),
        promptId: mockPromptId,
        version: 1,
        template: "v1 template",
        variables: [],
        createdAt: new Date(),
        // Add missing fields required by PromptVersionSchema
        tenantId: mockTenantId,
        changedBy: "test_user"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("rollbackToVersion", () => {
        it("should rollback to a previous version", async () => {
            const mockFindOnePrompt = jest.fn().mockResolvedValue({ ...mockPrompt, version: 2 });
            const mockFindOneVersion = jest.fn().mockResolvedValue(mockVersionSnapshot);
            const mockInsertOne = jest.fn().mockResolvedValue({ acknowledged: true });
            const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

            (getTenantCollection as any).mockImplementation(async (name: string) => {
                if (name === 'prompts') {
                    return { collection: { findOne: mockFindOnePrompt, updateOne: mockUpdateOne }, tenantId: mockTenantId };
                }
                if (name === 'prompt_versions') {
                    return { collection: { findOne: mockFindOneVersion, insertOne: mockInsertOne }, tenantId: mockTenantId };
                }
            });

            await PromptService.rollbackToVersion(
                mockPromptId.toString(),
                1,
                "admin_user",
                mockTenantId
            );

            // Expect a new version (snapshot of current state before rollback) to be saved
            expect(mockInsertOne).toHaveBeenCalled();

            // Expect the prompt to be updated with the old version's data
            expect(mockUpdateOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        template: "v1 template",
                        version: 3 // 2 -> 3 (new version is created representing the rollback)
                    })
                })
            );

            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                accion: "ROLLBACK_PROMPT",
                detalles: expect.objectContaining({ targetVersion: 1 })
            }));
        });

        it("should throw NOT_FOUND if target version does not exist", async () => {
            (getTenantCollection as any).mockResolvedValue({
                collection: { findOne: jest.fn().mockResolvedValue(null) },
                tenantId: mockTenantId
            });

            await expect(PromptService.rollbackToVersion(mockPromptId.toString(), 99, "user", mockTenantId))
                .rejects.toThrow(/Versión 99 no encontrada/);
        });
    });

    describe("listPrompts", () => {
        it("should list active prompts for a tenant", async () => {
            const mockFind = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue([mockPrompt])
                })
            });

            (getTenantCollection as any).mockResolvedValue({
                collection: { find: mockFind },
                tenantId: mockTenantId
            });

            const result = await PromptService.listPrompts(mockTenantId, true);

            expect(result).toHaveLength(1);
            expect(result[0].key).toBe("TEST_PROMPT");
            expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
                tenantId: mockTenantId,
                $or: expect.arrayContaining([{ active: true }])
            }));
        });
    });

    describe("getVersionHistory", () => {
        it("should return version history sorted by version descending", async () => {
            const mockFind = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue([mockVersionSnapshot])
                })
            });

            (getTenantCollection as any).mockResolvedValue({
                collection: { find: mockFind },
                tenantId: mockTenantId
            });

            const result = await PromptService.getVersionHistory(mockPromptId.toString(), mockTenantId);

            expect(result).toHaveLength(1);
            expect(result[0].version).toBe(1);
            expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
                promptId: expect.any(ObjectId),
                tenantId: mockTenantId
            }));
        });
    });
});
