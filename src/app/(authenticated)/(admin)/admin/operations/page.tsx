import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, FileText, ServerCrash, GitMerge } from "lucide-react";
import Link from "next/link";

const OPS_SECTIONS = [
    {
        title: "Observabilidad",
        description: "Métricas en tiempo real, SLAs y estado del sistema.",
        href: "/admin/operations/observability",
        icon: Activity
    },
    {
        title: "Ingesta y Jobs",
        description: "Estado de trabajos de indexación y colas de procesamiento.",
        href: "/admin/operations/ingest",
        icon: Database
    },
    {
        title: "Logs Técnicos",
        description: "Traza de errores, debug y búsqueda por Correlation ID.",
        href: "/admin/operations/logs",
        icon: ServerCrash
    },
    {
        title: "Mantenimiento",
        description: "Herramientas de limpieza y reindexación.",
        href: "/admin/operations/maintenance",
        icon: GitMerge
    },
    {
        title: "Estado de Servicios",
        description: "Status page de servicios externos (LLM, DB, etc).",
        href: "/admin/operations/status",
        icon: FileText
    }
];

export default function OperationsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Centro de Operaciones"
                subtitle="Monitorización y mantenimiento técnico de la plataforma."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {OPS_SECTIONS.map((section) => (
                    <Link key={section.href} href={section.href} className="block group">
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-slate-400 group-hover:border-l-primary">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <section.icon className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                </div>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}
