import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function BrandingSettingsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Personalización"
                subtitle="Ajusta la identidad visual de tu organización."
            />
            <Card className="h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-muted-foreground">
                    Próximamente: Editor de Branding y Plantillas.
                </CardContent>
            </Card>
        </PageContainer>
    );
}
