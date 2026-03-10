import React from "react";
import { auth } from "@/lib/auth";
import { DashboardService } from "@/services/admin/dashboard-service";
import { TenantsManagementClient } from "@/components/admin/superadmin/TenantsManagementClient";
import { Metadata } from "next";
import { TenantIdSchema } from "@/lib/schemas";

export const metadata: Metadata = {
    title: "Tenant Management | Global Command Center",
    description: "ERA 11: Global multi-tenant administration and health oversight.",
};

export default async function TenantsManagementPage() {
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    const stats = await DashboardService.getGlobalStats();

    return (
        <TenantsManagementClient
            initialTenants={(stats.recent_tenants || []).map(t => ({
                tenantId: TenantIdSchema.parse(t._id),
                name: t.name,
                industry: t.industry || 'ELEVATORS',
                tier: t.subscription?.tier || 'PRO',
                healthStatus: 'HEALTHY', // Fallback for list
                creado: t.createdAt
            }))}
        />
    );
}
