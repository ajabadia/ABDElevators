import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// This file must be imported BEFORE any zod schemas are evaluated.
extendZodWithOpenApi(z);
