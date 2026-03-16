import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { GovernanceHub } from "@/components/governance/GovernanceHub";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { ShieldCheck } from "lucide-react";

/**
 * 🛡️ Governance Hub (Era 12 / SOC2)
 * Portal unificado de gobernanza, seguridad y cumplimiento.
 * Standardized with FeatureShell wrap.
 */
export default async function GovernancePage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    return (
        <FeatureShell
            title="Governance Hub"
            highlight="SOC2 Compliance"
            subtitle="Gestión centralizada de trazabilidad, seguridad y operaciones relacionales."
            icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        >
            <GovernanceHub />
        </FeatureShell>
    );
}
