import React from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import { ComplianceAudit } from "@/components/admin/compliance/ComplianceAudit";
import { ComplianceClient } from "@/components/admin/compliance/ComplianceClient";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { AuditService } from "@/services/admin/AuditService";
import { SupportErrorState } from "@/components/shared/SupportErrorState";

/**
 * 🛡️ Compliance & AI Governance Page (Phase 343.2)
 * Industrial-grade compliance center for GDPR, SOC2 and EU AI Act.
 * Refactored to Server Component for Security & Performance.
 */
export default async function CompliancePage() {
    const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const t = await getTranslations('admin.compliance');

    if (!session?.user?.tenantId) {
        return null; // Should be handled by requireRole but extra safety
    }

    try {
        // Fetch real compliance logs for the tenant
        const logs = await AuditService.getComplianceLogs(session.user.tenantId, 15);

        return (
            <PageContainer className="animate-in fade-in duration-500">
                <PageHeader
                    title={t('title')}
                    highlight={t('highlight')}
                    subtitle={t('subtitle')}
                    icon={<ShieldCheck className="w-6 h-6 text-teal-600" />}
                />

                <div className="space-y-8 mt-6">
                    {/* Interactive sections (GDPR, AI Hub) */}
                    <ComplianceClient />

                    {/* Real Audit Trail Section */}
                    <div className="mt-8">
                        <ComplianceAudit logs={logs} />
                    </div>
                </div>
            </PageContainer>
        );
    } catch (error: any) {
        return (
            <PageContainer>
                <SupportErrorState
                    error={error}
                    reset={async () => { "use server"; }}
                    context="Compliance Hub"
                />
            </PageContainer>
        );
    }
}

