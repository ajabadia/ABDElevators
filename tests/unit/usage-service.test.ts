/**
 * @jest-environment node
 */
import { UsageService } from "../../src/lib/usage-service";
import { getTenantCollection } from "../../src/lib/db-tenant";
import { connectDB } from "../../src/lib/db";
import { NotificationService } from "../../src/lib/notification-service";
import { logEvento } from "../../src/lib/logger";

jest.mock("../../src/lib/db-tenant", () => ({
    getTenantCollection: jest.fn(),
}));

jest.mock("../../src/lib/db", () => ({
    connectDB: jest.fn(),
}));

jest.mock("../../src/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/lib/notification-service", () => ({
    NotificationService: {
        notify: jest.fn().mockResolvedValue(true)
    }
}));

describe("UsageService", () => {
    const mockTenantId = "tenant_123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("trackLLM", () => {
        it("should log LLM tokens usage", async () => {
            const mockInsertOne = jest.fn().mockResolvedValue({ acknowledged: true });
            (getTenantCollection as any).mockResolvedValue({
                collection: { insertOne: mockInsertOne }
            });

            await UsageService.trackLLM(mockTenantId, 500, "gemini-3-flash");

            expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
                tipo: 'LLM_TOKENS',
                valor: 500,
                recurso: 'gemini-3-flash'
            }));
        });

        it("should trigger a notification if consumption is high", async () => {
            const mockInsertOne = jest.fn().mockResolvedValue({ acknowledged: true });
            (getTenantCollection as any).mockResolvedValue({
                collection: { insertOne: mockInsertOne }
            });

            await UsageService.trackLLM(mockTenantId, 15000, "gemini-3-pro");

            expect(NotificationService.notify).toHaveBeenCalledWith(expect.objectContaining({
                type: 'BILLING_EVENT',
                level: 'WARNING',
                title: 'Pico de Consumo Detectado'
            }));
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                accion: 'HIGH_CONSUMPTION'
            }));
        });
    });

    describe("trackStorage", () => {
        it("should log storage usage", async () => {
            const mockInsertOne = jest.fn().mockResolvedValue({ acknowledged: true });
            (getTenantCollection as any).mockResolvedValue({
                collection: { insertOne: mockInsertOne }
            });

            await UsageService.trackStorage(mockTenantId, 1024 * 1024, "document_1.pdf");

            expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
                tipo: 'STORAGE_BYTES',
                valor: 1048576
            }));
        });
    });

    describe("getTenantROI", () => {
        it("should calculate ROI metrics based on usage logs and orders", async () => {
            const mockCountDocuments = jest.fn().mockResolvedValue(10); // 10 reports
            const mockAggregate = jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([
                    { _id: 'VECTOR_SEARCH', count: 20 },
                    { _id: 'SAVINGS_TOKENS', count: 5, totalValue: 5000 }
                ])
            });

            const mockDb = {
                collection: jest.fn().mockImplementation((name) => {
                    if (name === 'pedidos') return { countDocuments: mockCountDocuments };
                    if (name === 'usage_logs') return { aggregate: mockAggregate };
                })
            };
            (connectDB as any).mockResolvedValue(mockDb);

            const result = await UsageService.getTenantROI(mockTenantId);

            expect(result.metrics.analysisCount).toBe(10);
            expect(result.metrics.vectorSearches).toBe(20);
            expect(result.roi.totalSavedHours).toBeGreaterThan(0);
            expect(result.roi.estimatedCostSavings).toBeGreaterThan(0);
        });
    });
});
