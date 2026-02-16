
import { logEvento } from './logger';

/**
 * PII Masking Engine - Phase 61
 * Detects and masks sensitive personal information in technical documents.
 */
export class PIIMasker {
    // Regular Expressions for PII detection
    private static readonly PATTERNS = {
        EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        PHONE: /(?:\+?34\s?)?[6789]\d{8}/g, // Spanish phones
        INT_PHONE: /\+\d{1,3}\s?\d{4,12}/g, // International phones
        DNI_NIE: /[XYZ]?\d{7,8}[A-Z]/gi,     // Spanish ID (DNI/NIE)
        CREDIT_CARD: /\b(?:\d[ -]??){13,16}\b/g,
        IBAN: /[A-Z]{2}\d{2}(?:\s?\d{4}){5}/gi
    };

    /**
     * Masks PII in the given text.
     */
    static mask(text: string, tenantId: string, correlationId: string): {
        maskedText: string,
        metadata: { count: number, types: string[] }
    } {
        let maskedText = text;
        let count = 0;
        const detectedTypes = new Set<string>();

        // Mask Emails
        maskedText = maskedText.replace(this.PATTERNS.EMAIL, (match) => {
            count++;
            detectedTypes.add('EMAIL');
            return '[EMAIL_MASKED]';
        });

        // Mask Spanish Phones
        maskedText = maskedText.replace(this.PATTERNS.PHONE, (match) => {
            count++;
            detectedTypes.add('PHONE');
            return '[PHONE_MASKED]';
        });

        // Mask International Phones
        maskedText = maskedText.replace(this.PATTERNS.INT_PHONE, (match) => {
            count++;
            detectedTypes.add('PHONE');
            return '[PHONE_MASKED]';
        });

        // Mask DNI/NIE
        maskedText = maskedText.replace(this.PATTERNS.DNI_NIE, (match) => {
            count++;
            detectedTypes.add('ID_DOCUMENT');
            return '[ID_MASKED]';
        });

        // Mask Credit Cards
        maskedText = maskedText.replace(this.PATTERNS.CREDIT_CARD, (match) => {
            count++;
            detectedTypes.add('CREDIT_CARD');
            return '[CARD_MASKED]';
        });

        // Mask IBAN
        maskedText = maskedText.replace(this.PATTERNS.IBAN, (match) => {
            count++;
            detectedTypes.add('IBAN');
            return '[IBAN_MASKED]';
        });

        if (count > 0) {
            logEvento({
                level: 'INFO',
                source: 'PII_MASKER',
                action: 'DATA_MASKED',
                message: `Masked ${count} sensitive items in ingestion.`,
                correlationId,
                tenantId,
                details: {
                    itemCount: count,
                    types: Array.from(detectedTypes)
                }
            }).catch(e => console.error("[PII MASKER LOG ERROR]", e));
        }

        return {
            maskedText,
            metadata: {
                count,
                types: Array.from(detectedTypes)
            }
        };
    }
}
