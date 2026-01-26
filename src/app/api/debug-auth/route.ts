import { connectAuthDB } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

        // Prueba de fuego: Verificar contraseña manualmente
        const specificAdmin = await usersCollection.findOne({ email: 'admin@abd.com' });
        let passwordCheck = "N/A";
        let isValidEnv = "N/A";

        if (specificAdmin) {
            try {
                // Verificar si bcrypt funciona en este entorno
                const testHash = await bcrypt.hash('admin123', 10);
                const isMatch = await bcrypt.compare('admin123', specificAdmin.password);
                passwordCheck = isMatch ? "✅ MATCHES 'admin123'" : "❌ DOES NOT MATCH 'admin123'";
            } catch (err: any) {
                passwordCheck = `❌ BCRYPT ERROR: ${err.message}`;
            }
        }

        // Verificar logs recientes para ver si hay errores de login registrados
        const dbMain = await db.client.db('ABDElevators'); // Ver logs en DB principal
        const logsCollection = dbMain.collection("logs_aplicacion");
        const recentLogs = await logsCollection.find({ origen: 'AUTH' })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        // Verificar Secrets
        isValidEnv = process.env.AUTH_SECRET ? "✅ Defined" : "❌ MISSING AUTH_SECRET";

        return NextResponse.json({
            success: true,
            database: db.databaseName,
            timestamp: new Date().toISOString(),
            diagnostics: {
                adminUserFound: !!specificAdmin,
                adminEmail: specificAdmin?.email,
                adminMfaEnabled: specificAdmin?.mfaEnabled,
                passwordVerification: passwordCheck,
                authSecret: isValidEnv,
                nodeEnv: process.env.NODE_ENV,
                nextAuthUrl: process.env.NEXTAUTH_URL
            },
            stats: {
                totalUsers: count,
            },
            usersFound: users,
            authLogs: recentLogs.map(l => ({
                nivel: l.nivel,
                accion: l.accion,
                mensaje: l.mensaje,
                detalles: l.detalles,
                fecha: l.timestamp,
                stack: l.stack
            })),
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
