import { z } from 'zod';

/**
 * 📁 FileBlob Schema - Universal Storage Layer
 * 
 * Scope: GLOBAL (Platform-wide deduplication)
 * Purpose: Track physical file storage and reference counting.
 */
export const FileBlobSchema = z.object({
    _id: z.string(), // MD5 Hash (Hex)
    provider: z.enum(['cloudinary', 'gridfs', 's3']).default('cloudinary'),
    providerId: z.string(), // e.g. Cloudinary PublicID or Bucket Key
    url: z.string(),
    secureUrl: z.string().optional(),
    mimeType: z.string(),
    sizeBytes: z.number().int().nonnegative(),

    // Metadata for tracking
    refCount: z.number().int().nonnegative().default(1),
    tenantId: z.string().default('abd_global'), // Force global visibility

    // Integrity
    sha256: z.string().length(64).optional(),

    // Audit
    firstSeenAt: z.date().default(() => new Date()),
    lastSeenAt: z.date().default(() => new Date()),

    metadata: z.record(z.string(), z.any()).optional(),
});

export type FileBlob = z.infer<typeof FileBlobSchema>;
