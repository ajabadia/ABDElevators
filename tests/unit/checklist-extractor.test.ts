import { extractChecklist } from "@/lib/checklist-extractor";
import { v4 as uuidv4 } from "uuid";

// Mock external services
jest.mock("@/lib/llm", () => ({
    callGeminiMini: jest.fn().mockResolvedValue(JSON.stringify([
        { id: "550e8400-e29b-41d4-a716-446655440000", description: "Test item" }
    ]))
}));

jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

// Mock UsageService
jest.mock("@/lib/usage-service", () => ({
    UsageService: {
        trackLLM: jest.fn().mockResolvedValue(true)
    }
}));

// Mock PromptService (Missing in previous version)
jest.mock("@/lib/prompt-service", () => ({
    PromptService: {
        renderPrompt: jest.fn().mockResolvedValue("Mocked Prompt Content")
    }
}));

describe('Checklist Extractor', () => {
    it('should extract items and handle English keys correctly', async () => {
        const mockDocs = [
            { id: 'doc1', content: 'Check the voltage.' },
            { id: 'doc2', content: 'Verify the motor alignment.' }
        ];
        const correlationId = uuidv4();
        const tenantId = 'default_tenant';

        // Call the function
        const items = await extractChecklist(mockDocs, tenantId, correlationId);

        // Assertions
        expect(Array.isArray(items)).toBe(true);
        if (items.length > 0) {
            expect(items[0]).toHaveProperty('id');
            expect(items[0]).toHaveProperty('description');
        }
    });
});
