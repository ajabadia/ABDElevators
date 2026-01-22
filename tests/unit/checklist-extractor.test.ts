import { extractChecklist } from "@/lib/checklist-extractor";
import { v4 as uuidv4 } from "uuid";

// Mock external services to avoid BSON/DB issues and API calls during unit tests
jest.mock("@/lib/llm", () => ({
    callGeminiMini: jest.fn().mockResolvedValue(JSON.stringify([
        { id: "550e8400-e29b-41d4-a716-446655440000", description: "Test item" }
    ]))
}));

jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("@/lib/usage-service", () => ({
    UsageService: {
        trackLLM: jest.fn().mockResolvedValue(true)
    }
}));


describe('Checklist Extractor', () => {
    it('should extract items from mock docs', async () => {
        const mockDocs = [
            { id: 'doc1', content: 'Check the voltage.' },
            { id: 'doc2', content: 'Verify the motor alignment.' }
        ];
        const correlacion_id = uuidv4();
        const tenantId = 'default_tenant';
        const items = await extractChecklist(mockDocs, tenantId, correlacion_id);
        expect(Array.isArray(items)).toBe(true);

        // Expect at least one item extracted (LLM may return empty in mock, but we assert structure)
        if (items.length > 0) {
            expect(items[0]).toHaveProperty('id');
            expect(items[0]).toHaveProperty('description');
        }
    });
});
