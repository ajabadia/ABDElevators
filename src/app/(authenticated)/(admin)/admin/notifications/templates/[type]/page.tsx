import { connectDB } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TemplateEditor } from '@/components/admin/notifications/TemplateEditor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: { params: { type: string } }) {
    const db = await connectDB();

    // Buscar template actual
    const template = await db.collection('system_email_templates').findOne({ type: params.type });

    // Si no existe, pasamos null al editor para que sepa que es una creación inicial (seeding)
    // Opcionalmente podríamos tener una lógica de "defaults" aquí.

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/notifications/templates">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {template ? template.name : `Configurar ${params.type}`}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {template ? `Editando versión v${template.version}` : 'Configuración inicial de la plantilla'}
                    </p>
                </div>
            </div>

            <TemplateEditor type={params.type} initialData={JSON.parse(JSON.stringify(template))} />
        </div>
    );
}
