import React from "react";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { DashboardService } from "@/services/admin/dashboard-service";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard | ABD RAG Platform",
    description: "ERA 11: High-Performance Architecture Command Center",
};

/**
 * AdminDashboardPage
 * ERA 11: Async Server Component to eliminate waterfalls.
 * Fetches all metrics in parallel on the server and streams them to the client.
 */
export default async function AdminDashboardPage() {
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const tenantId = session.user.tenantId || "000000000000000000000000";

    // 🚀 Parallel Data Fetching on the Server
    const [stats, health] = await Promise.all([
        DashboardService.getGlobalStats(),
        DashboardService.getTenantHealth(tenantId)
    ]);

    return (
        <AdminDashboardClient
            initialStats={stats}
            initialHealth={health}
            isSuperAdmin={isSuperAdmin}
        />
    );
}
