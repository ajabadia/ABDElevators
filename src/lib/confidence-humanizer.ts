/**
 * Confidence Humanizer — ERA 6 Core Flow Utility
 *
 * Transforms numeric RAG confidence scores into human-friendly labels
 * for the Simple Mode experience. Expert Mode still shows raw scores.
 *
 * @module confidence-humanizer
 */

/** Confidence level bucket */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Result of humanizing a confidence score */
export interface HumanizedConfidence {
    /** Semantic level: high, medium, low */
    level: ConfidenceLevel;
    /** i18n key for the label (e.g. 'confidence.high') */
    labelKey: string;
    /** i18n key for the contextual message */
    messageKey: string;
    /** CSS class for the text color (design token) */
    colorClass: string;
    /** Icon identifier */
    icon: '✓✓' | '✓' | '⚠️';
    /** Original numeric score, preserved for Expert Mode */
    rawScore: number;
}

/** Thresholds for confidence level buckets */
const HIGH_THRESHOLD = 0.85;
const MEDIUM_THRESHOLD = 0.60;

/**
 * Humanizes a numeric confidence score into a UX-friendly representation.
 *
 * @param score - Confidence score between 0 and 1
 * @returns HumanizedConfidence with label, color, icon and message keys
 *
 * @example
 * ```ts
 * const result = humanizeConfidence(0.92);
 * // { level: 'high', labelKey: 'confidence.high', colorClass: 'text-primary', icon: '✓✓', ... }
 * ```
 */
export function humanizeConfidence(score: number): HumanizedConfidence {
    const clampedScore = Math.max(0, Math.min(1, score));

    if (clampedScore >= HIGH_THRESHOLD) {
        return {
            level: 'high',
            labelKey: 'confidence.high',
            messageKey: 'confidence.highMessage',
            colorClass: 'text-primary',
            icon: '✓✓',
            rawScore: clampedScore,
        };
    }

    if (clampedScore >= MEDIUM_THRESHOLD) {
        return {
            level: 'medium',
            labelKey: 'confidence.medium',
            messageKey: 'confidence.mediumMessage',
            colorClass: 'text-amber-500',
            icon: '✓',
            rawScore: clampedScore,
        };
    }

    return {
        level: 'low',
        labelKey: 'confidence.low',
        messageKey: 'confidence.lowMessage',
        colorClass: 'text-destructive',
        icon: '⚠️',
        rawScore: clampedScore,
    };
}

/**
 * Returns the humanized percentage as a rounded integer.
 * Useful for Expert Mode display next to the humanized label.
 *
 * @param score - Confidence score between 0 and 1
 * @returns Percentage as integer (e.g. 87)
 */
export function confidencePercent(score: number): number {
    return Math.round(Math.max(0, Math.min(1, score)) * 100);
}
