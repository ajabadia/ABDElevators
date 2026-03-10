import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GoldenSetsManager } from "@/components/admin/rag/GoldenSetsManager";
import { ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";

/**
 * 🎯 Golden Sets Management (Phase 310)
 * Unified interface for managing RAG test collections (Ground Truth).
 * Standardized with PageContainer/Header pattern.
 */
export default async function GoldenSetsPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title="Golden Sets (Colecciones de Oro)"
                subtitle="Gestión de queries de prueba y 'Ground Truth' para validación sistemática del RAG."
                icon={<ShieldAlert className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <div className="mt-6">
                <GoldenSetsManager />
            </div>
        </PageContainer>
    );
}
