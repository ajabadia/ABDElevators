import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { GovernanceHub } from "@/components/governance/GovernanceHub";

/**
 * 🛡️ Governance Hub (Era 12 / SOC2)
 * Portal unificado de gobernanza, seguridad y cumplimiento.
 */
export default async function GovernancePage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    return <GovernanceHub />;
}
