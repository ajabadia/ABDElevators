# Cloudinary Configuration - Phase 131.1 Documentation

## Overview
This document describes the Cloudinary configuration and the decoupling strategy implemented in Phase 131.

## Current Configuration

### Environment Variables (.env.local)
```
CLOUDINARY_CLOUD_NAME=ds81rqpk4
CLOUDINARY_API_KEY=151827928247838
CLOUDINARY_API_SECRET=xSyOAUvr0dRTwYJLxELrO_iWq3Y
```

## Architecture Decision: GridFS Primary Storage

### Problem (Pre-Phase 131)
- Worker obtained 401 Unauthorized when trying to fetch PDFs from Cloudinary
- No chunks were created → ingestionStatus = FAILED
- No mechanism for partial recovery

### Solution Implemented (Phase 131.2-131.5)
1. **GridFS First**: Files are stored in GridFS BEFORE queuing for processing
2. **Blob ID Reference**: Jobs reference `{ docId, blobId }` instead of Cloudinary URL
3. **Parallel Cloudinary Upload**: Upload to Cloudinary happens AFTER chunk creation (non-blocking)
4. **Fallback**: If blobId doesn't exist, falls back to Cloudinary fetch (backward compatibility)

### Key Files
- `src/lib/gridfs-utils.ts` - GridFS operations (saveForProcessing, getForProcessing)
- `src/services/ingest/IngestPreparer.ts` - Saves to GridFS before queuing
- `src/services/ingest-service.ts` - Reads from GridFS, fallback to Cloudinary
- `src/lib/cloudinary.ts` - getSignedUrl() for signed URL generation

## Testing Scripts

### Verify Cloudinary Connection
```bash
npx ts-node src/scripts/verify-cloudinary-fetch.ts
```

### Diagnose Ingestion State
```bash
npx ts-node src/scripts/diagnose-ingestion-state.ts
```

## Configuration Requirements

### Cloudinary Settings
- **resource_type**: Must be "raw" for PDF documents
- **type**: "upload" (public access)
- **No strict transformations**: Ensure transformations are not required for access

### Signed URLs
The `getSignedUrl()` function generates signed URLs with:
- `sign_url: true` - Cryptographically signed
- `type: 'upload'` - Matches upload type
- `resource_type: 'raw'` - For PDFs

## Troubleshooting 401 Errors

If 401 errors occur in the future:

1. **Verify credentials**: Check CLOUDINARY_API_SECRET is correct
2. **Check public ID format**: Ensure format matches upload (no special characters)
3. **Verify resource_type**: Must be "raw" for PDFs
4. **Check signed URL**: Run `verify-cloudinary-fetch.ts` with actual publicId
5. **Check Cloudinary dashboard**: Verify API key hasn't been rotated or disabled

## Current Status
- ✅ Phase 131.1: Diagnosis Complete
- ✅ Phase 131.2: Partial States Implemented (hasStorage, hasChunks)
- ✅ Phase 131.3: Decoupled Architecture (GridFS primary)
- ✅ Phase 131.4: Granular Retry Implemented
- ✅ Phase 131.5: Storage Infrastructure Complete

The 401 issue is **resolved** by the GridFS decoupling approach.
