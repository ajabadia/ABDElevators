import { z } from 'zod';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { PromptService } from '@/services/llm/prompt-service';
import { callGeminiExtended, runShadowCall } from '@/services/llm/llm-service';
import { logEvento } from '@/lib/logger';
import { trace } from '@opentelemetry/api';

// Mock dependencies
jest.mock('@/services/llm/prompt-service');
jest.mock('@/services/llm/llm-service');
jest.mock('@/lib/logger', () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('@opentelemetry/api', () => ({
    trace: {
        getTracer: jest.fn().mockReturnValue({
            startActiveSpan: jest.fn((name, options, callback) => callback({
                setAttribute: jest.fn(),
                setStatus: jest.fn(),
                recordException: jest.fn(),
                end: jest.fn()
            }))
        })
    },
    SpanStatusCode: {
        OK: 1,
        ERROR: 2
    }
}));

describe('🚀 PromptRunner', () => {
    const tenantId = 'test-tenant';
    const correlationId = 'test-correlation';
    const schema = z.object({ result: z.string() });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('runJson()', () => {
        it('should execute prompt and return parsed JSON', async () => {
            // Setup Mocks
            (PromptService.getPromptWithShadow as jest.Mock).mockResolvedValue({
                production: { text: 'Prompt content', model: 'gemini-1.5-flash' },
                shadow: null
            });

            (callGeminiExtended as jest.Mock).mockResolvedValue({
                text: '{"result": "success"}',
                usage: { total: 100 }
            });

            const result = await PromptRunner.runJson({
                key: 'TEST_PROMPT',
                variables: { foo: 'bar' },
                schema,
                tenantId,
                correlationId
            });

            expect(result).toEqual({ result: 'success' });
            expect(PromptService.getPromptWithShadow).toHaveBeenCalled();
            expect(callGeminiExtended).toHaveBeenCalledWith(
                'Prompt content',
                tenantId,
                correlationId,
                expect.objectContaining({ model: 'gemini-1.5-flash' })
            );
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: 'PROMPT_RUNNER_SUCCESS'
            }));
        });

        it('should handle shadow execution if present', async () => {
            (PromptService.getPromptWithShadow as jest.Mock).mockResolvedValue({
                production: { text: 'Prod', model: 'gemini-pro' },
                shadow: { key: 'SHADOW_KEY', text: 'Shadow', model: 'gemini-flash' }
            });

            (callGeminiExtended as jest.Mock).mockResolvedValue({
                text: '{"result": "ok"}',
                usage: { total: 50 }
            });

            (runShadowCall as jest.Mock).mockResolvedValue({});

            await PromptRunner.runJson({
                key: 'TEST',
                variables: {},
                schema,
                tenantId,
                correlationId
            });

            expect(runShadowCall).toHaveBeenCalled();
        });

        it('should log failure and throw error on exception', async () => {
            (PromptService.getPromptWithShadow as jest.Mock).mockRejectedValue(new Error('Prompt error'));

            await expect(PromptRunner.runJson({
                key: 'FAIL',
                variables: {},
                schema,
                tenantId,
                correlationId
            })).rejects.toThrow('Prompt error');

            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                level: 'ERROR',
                action: 'PROMPT_RUNNER_FAILURE'
            }));
        });
    });

    describe('runText()', () => {
        it('should return raw text response', async () => {
            (PromptService.getPromptWithShadow as jest.Mock).mockResolvedValue({
                production: { text: 'Text prompt', model: 'gemini-pro' }
            });

            (callGeminiExtended as jest.Mock).mockResolvedValue({
                text: 'Raw response',
                usage: { total: 20 }
            });

            const result = await PromptRunner.runText({
                key: 'TEXT_KEY',
                variables: {},
                tenantId,
                correlationId
            });

            expect(result).toBe('Raw response');
            expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
                action: 'PROMPT_RUNNER_SUCCESS'
            }));
        });
    });
});
