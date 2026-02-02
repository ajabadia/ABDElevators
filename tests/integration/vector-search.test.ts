/**
 * @jest-environment node
 */

// Mocking BEFORE imports to ensure they take effect
jest.mock("@/lib/auth", () => ({
    auth: jest.fn()
}));
jest.mock("@/lib/rag-service", () => ({
    pureVectorSearch: jest.fn()
}));
jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

import { GET } from "../../src/app/api/entities/[id]/vector-search/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { pureVectorSearch } from "@/lib/rag-service";

describe("Vector Search API Integration", () => {
    const mockPedidoId = "678e5f7f9a1b2c3d4e5f6g7h";
    const mockTenantId = "tenant_123";

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockResolvedValue({
            user: { tenantId: mockTenantId, role: "TECNICO" }
        });
    });

    it("should return 200 and search results", async () => {
        const mockResults = [
            { texto: "Resultado 1", source: "doc1.pdf", score: 0.9, tipo: "motor", modelo: "M1" }
        ];
        (pureVectorSearch as jest.Mock).mockResolvedValue(mockResults);

        const req = new NextRequest(`http://localhost/api/pedidos/${mockPedidoId}/vector-search?query=test&limit=2`);
        const response = await GET(req, { params: Promise.resolve({ id: mockPedidoId }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.resultados).toHaveLength(1);
        expect(data.resultados[0].texto).toBe("Resultado 1");
        expect(data.duracion_ms).toBeDefined();
    });

    it("should return 400 for missing query", async () => {
        const req = new NextRequest(`http://localhost/api/pedidos/${mockPedidoId}/vector-search`);
        const response = await GET(req, { params: Promise.resolve({ id: mockPedidoId }) });

        expect(response.status).toBe(400);
    });

    it("should return 401 if not authenticated", async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest(`http://localhost/api/entities/${mockPedidoId}/vector-search?query=test`);
        const response = await GET(req, { params: Promise.resolve({ id: mockPedidoId }) });

        expect(response.status).toBe(401);
    });

    it("should respect limit and min_score params", async () => {
        (pureVectorSearch as jest.Mock).mockResolvedValue([]);

        const req = new NextRequest(`http://localhost/api/entities/${mockPedidoId}/vector-search?query=test&limit=10&min_score=0.8`);
        await GET(req, { params: Promise.resolve({ id: mockPedidoId }) });

        expect(pureVectorSearch).toHaveBeenCalledWith(
            "test",
            mockTenantId,
            expect.any(String),
            { limit: 10, min_score: 0.8 }
        );
    });
});
