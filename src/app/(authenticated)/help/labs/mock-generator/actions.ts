"use server";

/**
 * 🛠️ Mock Data Generation Actions (Disabled for Production Safety)
 * As of Phase 410, mock generation has been moved to CLI scripts 
 * (npm run db:seed) to prevent unauthorized execution or bundle bloat in production.
 */

export async function generateMockDataAction(type: string) {
    return { success: false, message: "El generador ha sido migrado a CLI (npm run db:seed) por seguridad." };
}

export async function purgeMockDataAction() {
    return { success: false, message: "La purga ha sido migrada a CLI por seguridad." };
}
