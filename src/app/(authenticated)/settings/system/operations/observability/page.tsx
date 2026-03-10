import { ObservabilityDashboard } from "@/components/admin/operations/ObservabilityDashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function ObservabilityPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Observabilidad"
                subtitle="Métricas operativas y estado de salud del sistema."
                backHref="/admin/operations"
            />
            <ObservabilityDashboard />
        </PageContainer>
    );
}
