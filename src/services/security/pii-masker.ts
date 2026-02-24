
import { logEvento } from '@/lib/logger';

export interface PIIOptions {
    detectOnly?: boolean;
    placeholder?: string;
    correlationId?: string;
    tenantId?: string;
}

export interface PIIResult {
    originalText: string;
    processedText: string;
    detections: Array<{
        type: string;
        match: string;
        index: number;
    }>;
    metadata: {
        count: number;
        types: string[];
        isClean: boolean;
    };
}

/**
 * PII Masking Engine - Phase 8 Polish
 * Detects and optionally masks sensitive personal information.
 * Rule #13: Data Protection (GDPR Compliance)
 */
export class PIIMasker {
    private static readonly PATTERNS = {
        EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        PHONE: /(?:\+?34\s?)?[6789]\d{8}/g,
        INT_PHONE: /\+\d{1,3}\s?\d{4,12}/g,
        DNI_NIE: /[XYZ]?\d{7,8}[A-Z]/gi,
        CREDIT_CARD: /\b(?:\d[ -]??){13,16}\b/g,
        IBAN: /[A-Z]{2}\d{2}(?:\s?\d{4}){5}/gi
    };

    /**
     * Entry point for masking (standard behavior).
     */
    static async mask(text: string, tenantId: string, correlationId: string): Promise<{
        maskedText: string,
        metadata: { count: number, types: string[], isClean: boolean }
    }> {
        const result = await this.process(text, { tenantId, correlationId, detectOnly: false });
        return {
            maskedText: result.processedText,
            metadata: {
                count: result.metadata.count,
                types: result.metadata.types,
                isClean: result.metadata.isClean
            }
        };
    }

    /**
     * Entry point for detection only.
     */
    static async detect(text: string, tenantId: string, correlationId: string): Promise<PIIResult> {
        return await this.process(text, { tenantId, correlationId, detectOnly: true });
    }

    /**
     * Core processing logic.
     */
    private static async process(text: string, options: PIIOptions): Promise<PIIResult> {
        const { detectOnly = false, placeholder = '[MASKED]', tenantId = 'SYSTEM', correlationId = 'SYSTEM' } = options;
        let processedText = text;
        const detections: PIIResult['detections'] = [];
        const detectedTypes = new Set<string>();

        // We run matches for each pattern
        Object.entries(this.PATTERNS).forEach(([type, regex]) => {
            let match;
            const tempRegex = new RegExp(regex); // Reset lastIndex
            while ((match = tempRegex.exec(text)) !== null) {
                detections.push({
                    type,
                    match: match[0],
                    index: match.index
                });
                detectedTypes.add(type);
            }
        });

        // If masking is requested, we do a multi-pass replace (or better, a sorted-index replace to be safe)
        if (!detectOnly && detections.length > 0) {
            // Simple replace for now as placeholders are usually fixed length strings
            // For production robustness, one should replace from back to front by index.
            Object.entries(this.PATTERNS).forEach(([type, regex]) => {
                processedText = processedText.replace(regex, placeholder);
            });
        }

        const count = detections.length;

        if (count > 0 && tenantId !== 'SYSTEM') {
            try {
                await logEvento({
                    level: detectOnly ? 'DEBUG' : 'INFO',
                    source: 'PII_MASKER',
                    action: detectOnly ? 'PII_DETECTED' : 'DATA_MASKED',
                    message: `${detectOnly ? 'Detected' : 'Masked'} ${count} personal data items.`,
                    correlationId,
                    tenantId,
                    details: {
                        count,
                        types: Array.from(detectedTypes),
                        detectOnly
                    }
                });
            } catch (e) {
                console.error("[PII MASKER LOG ERROR]", e);
            }
        }

        return {
            originalText: text,
            processedText,
            detections,
            metadata: {
                count,
                types: Array.from(detectedTypes),
                isClean: count === 0
            }
        };
    }
}
