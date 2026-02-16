import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsSettingsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Notificaciones"
                subtitle="Configura tus preferencias de alertas y notificaciones."
            />
            <Card className="h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-muted-foreground">
                    Próximamente: Panel de configuración de notificaciones.
                </CardContent>
            </Card>
        </PageContainer>
    );
}
