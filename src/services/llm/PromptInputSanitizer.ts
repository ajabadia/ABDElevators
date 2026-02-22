
/**
 * PromptInputSanitizer - Specialized utility for cleaning LLM inputs.
 * Rule #12: Prompt Governance & Protection (Anti-Injection)
 */
export class PromptInputSanitizer {

    /**
     * Sanitizes variables to prevent simple prompt injection attacks.
     * Removes control characters and specific templating syntax.
     */
    static sanitize(input: any): string {
        if (input === null || input === undefined) return '';
        if (typeof input !== 'string') return String(input);

        // Basic cleaning
        let cleaned = input.trim();

        // Prevent template escape
        cleaned = cleaned
            .replace(/{{/g, '{')
            .replace(/}}/g, '}')
            .replace(/<%|%>|<\?|\?>/g, '') // Remove alternate template markers
            .replace(/---/g, '-')
            .replace(/###/g, '#')
            .replace(/"""/g, '"');

        // PII protection if we detect patterns in raw input (optional layer)
        // Note: PIIMasker should be called explicitly if full anonymization is needed.

        return cleaned;
    }

    /**
     * Mass sanitization of a variables object.
     */
    static sanitizeRecord(variables: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(variables)) {
            sanitized[key] = this.sanitize(value);
        }
        return sanitized;
    }

    /**
     * Checks for high-risk injection keywords or patterns.
     */
    static isHighRisk(input: string): boolean {
        const lower = input.toLowerCase();
        const injectionMarkers = [
            'ignore previous instructions',
            'forget everything you know',
            'system prompt',
            'acting as a',
            'jailbreak',
            'do anything now',
            'dan mode'
        ];

        return injectionMarkers.some(marker => lower.includes(marker));
    }
}
