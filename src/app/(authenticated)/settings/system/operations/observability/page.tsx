import { ObservabilityDashboard } from "@/components/admin/operations/ObservabilityDashboard";
import { FeatureShell } from "@/components/shared/FeatureShell";

export default function ObservabilityPage() {
    return (
        <FeatureShell
            title="Observabilidad"
            subtitle="Métricas operativas y estado de salud del sistema."
            backHref="/admin/operations"
        >
            <ObservabilityDashboard />
        </FeatureShell>
    );
}
