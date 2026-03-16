import { PromptService } from '@/services/llm/prompt-service';

// Mock DB and Logger
jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn().mockImplementation(() => Promise.resolve({
        findOne: jest.fn().mockResolvedValue(null),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
        find: jest.fn().mockReturnValue({ 
            toArray: jest.fn().mockResolvedValue([]) 
        }),
    })),
}));

jest.mock('@/lib/db', () => ({
    connectDB: jest.fn(),
    getMongoClient: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
    logEvento: jest.fn(),
}));

jest.mock('next/cache', () => ({
    unstable_cache: (fn: any) => fn,
}));

jest.mock('@/services/llm/ai-model-manager', () => ({
    AiModelManager: {
        getFunctionalModel: jest.fn().mockResolvedValue('gemini-2.0-flash'),
        getTenantAiConfig: jest.fn().mockResolvedValue({
            defaultModel: 'gemini-2.0-flash',
            maxTokensPerRequest: 4096
        })
    }
}));

jest.mock('@/services/auth/TenantLimitsService', () => ({
    TenantLimitsService: {
        getTenantRateLimits: jest.fn().mockResolvedValue(null)
    }
}));

describe('PromptService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(PromptService).toBeDefined();
    });

    it('should fall back to hardcoded prompt if DB fetch fails', async () => {
        const session = { user: { tenantId: 'test-tenant', id: 'user-1' } } as any;
        const result = await PromptService.getRenderedPrompt(
            'TECHNICALENTITY_PATTERNS',
            { context: 'test context' },
            'test-tenant',
            'PRODUCTION',
            'GENERIC',
            session
        );
        expect(result).toBeDefined();
        // Check that it contains something expected from the fallback or the logic
        expect(result.text).toBeDefined();
        expect(typeof result.text).toBe('string');
    });
});
