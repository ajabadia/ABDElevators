import { SecurityView } from "@/components/admin/security/SecurityView";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function SecurityPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Seguridad y Auditoría"
                subtitle="Centro de control para permisos, logs de auditoría y seguridad."
            />
            <SecurityView />
        </PageContainer>
    );
}
