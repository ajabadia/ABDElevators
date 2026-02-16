import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function IngestPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Ingesta y Jobs"
                subtitle="Monitorización de procesos de ingesta de documentos."
            />
            <Card className="h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-muted-foreground">
                    Próximamente: Panel de control de Jobs y Colas.
                </CardContent>
            </Card>
        </PageContainer>
    );
}
