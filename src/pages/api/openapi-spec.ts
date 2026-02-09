import type { NextApiRequest, NextApiResponse } from 'next';
import { generateOpenApiSpec } from '@/lib/openapi';

/**
 * Endpoint en Pages Router para evitar crasheos de análisis estático en App Router build worker.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const spec = generateOpenApiSpec();
        res.status(200).json(spec);
    } catch (error) {
        console.error('❌ Error generating OpenAPI spec:', error);
        res.status(500).json({ success: false, error: 'GENERATE_SPEC_ERROR' });
    }
}
