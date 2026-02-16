/**
 * @jest-environment node
 */
import { UsageService } from "../../src/lib/usage-service";
import { connectDB } from "../../src/lib/db";

jest.mock("../../src/lib/db", () => ({
    connectDB: jest.fn(),
}));

jest.mock("../../src/lib/db-tenant", () => ({
    getTenantCollection: jest.fn(),
}));

describe("UsageService Extended Coverage", () => {
    const mockTenantId = "tenant_123";
    const mockUserId = "user_456";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserMetrics", () => {
        it("should calculate user metrics correctly", async () => {
            const mockCountDocuments = jest.fn()
                .mockResolvedValueOnce(5)  // validaciones
                .mockResolvedValueOnce(3)  // tickets created
                .mockResolvedValueOnce(2); // tickets resolved

            const mockDb = {
                collection: jest.fn().mockReturnValue({
                    countDocuments: mockCountDocuments
                })
            };
            (connectDB as any).mockResolvedValue(mockDb);

            const result = await UsageService.getUserMetrics(mockUserId, mockTenantId);

            expect(result.validationsCount).toBe(5);
            expect(result.ticketsCreated).toBe(3);
            expect(result.ticketsResolved).toBe(2);
            // Score = (5 * 5) + (2 * 10) = 25 + 20 = 45
            expect(result.efficiencyScore).toBe(45);
        });

        it("should return zeros on error", async () => {
            (connectDB as any).mockRejectedValue(new Error("DB Connection Failed"));

            const result = await UsageService.getUserMetrics(mockUserId, mockTenantId);

            expect(result.validationsCount).toBe(0);
            expect(result.efficiencyScore).toBe(0);
        });
    });
});
