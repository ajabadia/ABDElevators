import { connectAuthDB } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = await connectAuthDB();

        // Obtenemos metadatos básicos de la colección de usuarios
        const usersCollection = db.collection("users");
        const count = await usersCollection.countDocuments();

        // Consultamos los emails sin las contraseñas para seguridad
        const users = await usersCollection.find({})
            .project({ email: 1, mfaEnabled: 1, _id: 1 })
            .limit(10)
            .toArray();

        // Verificar logs recientes para ver si hay errores de login registrados
        const logsCollection = db.collection("logs");
        const recentLogs = await logsCollection.find({ origen: 'AUTH' })
            .sort({ fecha: -1 })
            .limit(5)
            .toArray();

        return NextResponse.json({
            success: true,
            database: db.databaseName,
            timestamp: new Date().toISOString(),
            stats: {
                totalUsers: count,
            },
            usersFound: users,
            authLogs: recentLogs,
            environment: {
                hasAuthUri: !!process.env.MONGODB_AUTH_URI,
                hasMainUri: !!process.env.MONGODB_URI,
                nodeEnv: process.env.NODE_ENV,
                vercelEnv: process.env.VERCEL_ENV || 'local'
            }
        });
    } catch (error: any) {
        console.error("Debug Auth Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
