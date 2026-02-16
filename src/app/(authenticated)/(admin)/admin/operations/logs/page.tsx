import { AuditLogTable } from "@/components/admin/security/AuditLogTable";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function LogsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Logs Técnicos"
                subtitle="Registro detallado de eventos y errores del sistema."
            />
            <AuditLogTable />
        </PageContainer>
    );
}
