import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 [DEBUG_DB] Iniciando prueba de conexión...');
        const start = Date.now();
        const db = await connectDB();
        const duration = Date.now() - start;

        const collections = await db.listCollections().toArray();

        return NextResponse.json({
            success: true,
            status: 'Connected',
            durationMs: duration,
            database: db.databaseName,
            collections: collections.map(c => c.name),
            env: {
                hasUri: !!process.env.MONGODB_URI,
                nodeEnv: process.env.NODE_ENV
            }
        });
    } catch (error: any) {
        console.error('❌ [DEBUG_DB] Error capturado:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            name: error.name,
            code: error.code,
            details: error.details,
            cause: error.cause?.message || 'No direct cause',
            stack: error.stack,
            env: {
                hasUri: !!process.env.MONGODB_URI,
                nodeEnv: process.env.NODE_ENV
            }
        }, { status: 500 });
    }
}
