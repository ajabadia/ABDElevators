import LogExplorer from '@/components/admin/LogExplorer';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function AdminLogsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Registros del Sistema"
                subtitle="Supervisa la salud del sistema y auditoría de cumplimiento."
            />
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <LogExplorer />
            </ContentCard>
        </PageContainer>
    );
}
