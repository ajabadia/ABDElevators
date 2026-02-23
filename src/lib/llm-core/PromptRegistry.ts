import { PROMPTS as MASTER_PROMPTS } from '@/lib/prompts';

/**
 * 🏛️ PromptRegistry
 * Centralized registry for all hardcoded prompts (Era 7).
 */
export class PromptRegistry {
    /**
     * Gets a prompt template by its key from the master registry.
     */
    static getTemplate(key: string): string | null {
        const prompt = MASTER_PROMPTS[key];
        return prompt ? prompt.template : null;
    }

    /**
     * Replaces variables in a template using {{variable}} syntax.
     */
    static format(template: string, variables: Record<string, any>): string {
        let formatted = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            formatted = formatted.replace(regex, String(value));
        }
        return formatted;
    }

    /**
     * Gets and formats a prompt by key.
     */
    static getFormatted(key: string, variables: Record<string, any>): string {
        const template = this.getTemplate(key);
        if (!template) {
            throw new Error(`[PromptRegistry] Prompt key not found: ${key}`);
        }
        return this.format(template, variables);
    }
}
