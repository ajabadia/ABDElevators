"use server";

import { connectDB } from "@/lib/db";
import { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { EntityIdSchema } from "@/lib/schemas/common";

/**
 * 🛠️ Mock Data Generation Actions
 */

async function checkSuperAdmin() {
    // In a real scenario, we would use auth() from NextAuth or similar
    // For now, we assume the middleware/layout protects this, 
    // but in production, we MUST verify the session here.
    return true;
}

export async function generateMockDataAction(type: string) {
    if (!await checkSuperAdmin()) {
        return { success: false, message: "No autorizado." };
    }

    try {
        const db = await connectDB();

        if (type === 'tenants') {
            const mockTenants = Array.from({ length: 5 }).map((_, i) => ({
                name: `Mock Tenant ${i + 1}`,
                slug: `mock-tenant-${i + 1}`,
                status: 'active',
                isMock: true,
                createdAt: new Date(),
                metadata: {
                    industry: 'Elevators',
                    generatedBy: 'MockGenerator'
                }
            }));

            const result = await db.collection('organizations').insertMany(mockTenants);
            revalidatePath('/help/labs/mock-generator');
            return {
                success: true,
                message: "Tenants generados correctamente.",
                count: result.insertedCount
            };
        }

        if (type === 'assets') {
            // Find a mock tenant to attach assets to
            const tenant = await db.collection('organizations').findOne({ isMock: true });
            if (!tenant) {
                return { success: false, message: "Primero debes generar tenants mock." };
            }

            const mockAssets = Array.from({ length: 20 }).map((_, i) => ({
                tenantId: tenant._id,
                title: `Mock Document ${i + 1}`,
                type: i % 2 === 0 ? 'PDF' : 'MARKDOWN',
                content: `Synthetic content for mock document ${i + 1}.`,
                isMock: true,
                createdAt: new Date(),
                status: 'indexed'
            }));

            const result = await db.collection('knowledge_assets').insertMany(mockAssets);
            revalidatePath('/help/labs/mock-generator');
            return {
                success: true,
                message: "Assets generados correctamente.",
                count: result.insertedCount
            };
        }

        return { success: false, message: "Tipo de generación no soportado." };
    } catch (error) {
        console.error("MOCK_GENERATOR_ERROR:", error);
        return { success: false, message: "Error en el servidor durante la generación." };
    }
}

export async function purgeMockDataAction() {
    if (!await checkSuperAdmin()) {
        return { success: false, message: "No autorizado." };
    }

    try {
        const db = await connectDB();

        const res1 = await db.collection('organizations').deleteMany({ isMock: true });
        const res2 = await db.collection('knowledge_assets').deleteMany({ isMock: true });
        const res3 = await db.collection('users').deleteMany({ isMock: true });

        revalidatePath('/help/labs/mock-generator');
        return {
            success: true,
            message: `Datos purgados: ${res1.deletedCount} tenants, ${res2.deletedCount} assets, ${res3.deletedCount} usuarios.`
        };
    } catch (error) {
        console.error("MOCK_PURGE_ERROR:", error);
        return { success: false, message: "Error en el servidor durante la purga." };
    }
}
