import { getApiKeys } from "@/actions/api-keys";
import { ApiKeyList } from "@/components/admin/api-keys/ApiKeyList";
import { CreateApiKeyModal } from "@/components/admin/api-keys/CreateApiKeyModal";
import { ApiDocsSnippet } from "@/components/admin/api-keys/ApiDocsSnippet";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { Key } from "lucide-react";

export default async function ApiKeysPage() {
    const keys = await getApiKeys();

    return (
        <PageContainer>
            <PageHeader
                title="API Access Management"
                subtitle="Manage API Keys for external integrations (ERP, CRM, IoT)."
                actions={<CreateApiKeyModal />}
            />

            <div className="grid gap-6">
                <ContentCard title="Active Keys" icon={<Key size={20} />}>
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                        <ApiKeyList keys={keys as any[]} />
                    </Suspense>
                </ContentCard>

                <ApiDocsSnippet />
            </div>
        </PageContainer>
    );
}
