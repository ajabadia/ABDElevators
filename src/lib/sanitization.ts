/**
 * 🛡️ [SECURITY] Global Sanitization Utilities
 * Centralized regex patterns and helpers to prevent NoSQL injection, 
 * log poisoning, and unauthorized path traversal.
 */

export const REGEX = {
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    IP_ADDRESS: /^[0-9a-fA-F.:%]+$/, // Support IPv4 and IPv6
    PATHNAME: /^[a-zA-Z0-9\/\.\-\_]+$/,
    MIDDLEWARE_TOKEN: /^[a-fA-F0-9]{32}$/, // Next.js internal subrequest token
};

export const sanitizer = {
    /**
     * Sanitizes a pathname for logging.
     */
    path: (input: string | null) => 
        (input ?? '').replace(/[^\w\/\.\-]/g, '').substring(0, 200),

    /**
     * Sanitizes an IP address for logging.
     */
    ip: (input: string | null) => 
        (input ?? '').replace(/[^\d\.\:a-fA-F%]/g, '').substring(0, 45),

    /**
     * Truncates sensitive headers for logging.
     */
    header: (input: string | null, length = 10) => 
        input ? `${input.substring(0, length)}...` : null,

    /**
     * Strict verification for MongoDB ObjectIDs.
     */
    isValidObjectId: (id: string) => REGEX.OBJECT_ID.test(id),
};

/**
 * 👤 [SECURITY] PII MASKING RULES (Rule #13)
 * Masks sensitive fields in objects for safe consumption.
 */
const SENSITIVE_FIELDS = ['taxId', 'phone', 'password', 'secret', 'iban', 'dni', 'billingEmail'];

export function maskSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(item => maskSensitiveData(item)) as unknown[];
    }

    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
            if (typeof value === 'string' && value.length > 4) {
               masked[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
            } else {
               masked[key] = '***';
            }
        } else if (typeof value === 'object' && value !== null) {
            masked[key] = maskSensitiveData(value);
        } else {
            masked[key] = value;
        }
    }
    return masked;
}
