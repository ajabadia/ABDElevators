import { connectLogsDB } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TemplateEditor } from '@/components/admin/notifications/TemplateEditor';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: { params: Promise<{ type: string }> }) {
    const { type } = await params;
    const db = await connectLogsDB();

    // Buscar template actual
    const template = await db.collection('notification_templates').findOne({ type });

    return (
        <PageContainer>
            <PageHeader
                title={template ? template.name : `Configurar ${type}`}
                subtitle={template ? `Editando versión v${template.version}` : 'Configuración inicial de la plantilla'}
                actions={
                    <Link href="/admin/notifications/templates">
                        <Button variant="outline" size="sm" className="rounded-xl">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Volver al Listado
                        </Button>
                    </Link>
                }
            />

            <TemplateEditor type={type} initialData={JSON.parse(JSON.stringify(template))} />
        </PageContainer>
    );
}
