import { z } from 'zod';
import { LlmJsonParser } from '@/lib/llm-core/LlmJsonParser';
import { AppError } from '@/lib/errors';

describe('🧪 LlmJsonParser', () => {
    const correlationId = 'test-corr-id';
    const schema = z.object({
        name: z.string(),
        age: z.number()
    });

    describe('clean()', () => {
        it('should remove markdown fences', () => {
            const raw = '```json\n{"name": "Test"}\n```';
            expect(LlmJsonParser.clean(raw)).toBe('{"name": "Test"}');
        });

        it('should extract content between braces', () => {
            const raw = 'The result is: {"name": "Test"} and some extra text.';
            expect(LlmJsonParser.clean(raw)).toBe('{"name": "Test"}');
        });

        it('should handle arrays', () => {
            const raw = 'List: [{"id": 1}, {"id": 2}]';
            expect(LlmJsonParser.clean(raw)).toBe('[{"id": 1}, {"id": 2}]');
        });

        it('should remove trailing commas', () => {
            const raw = '{"name": "Test",}';
            expect(LlmJsonParser.clean(raw)).toBe('{"name": "Test"}');
        });
    });

    describe('parse()', () => {
        it('should parse valid JSON matching the schema', () => {
            const raw = '{"name": "John", "age": 30}';
            const result = LlmJsonParser.parse({
                raw,
                schema,
                source: 'TEST',
                correlationId
            });
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        it('should repair unbalanced braces', () => {
            const raw = '{"name": "John", "age": 30';
            const result = LlmJsonParser.parse({
                raw,
                schema,
                source: 'TEST',
                correlationId
            });
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        it('should throw AppError on invalid JSON that cannot be repaired', () => {
            const raw = 'invalid junk';
            expect(() => LlmJsonParser.parse({
                raw,
                schema,
                source: 'TEST',
                correlationId
            })).toThrow(AppError);
        });

        it('should throw AppError on schema validation failure', () => {
            const raw = '{"name": "John", "age": "thirty"}';
            expect(() => LlmJsonParser.parse({
                raw,
                schema,
                source: 'TEST',
                correlationId
            })).toThrow(AppError);
        });
    });
});
