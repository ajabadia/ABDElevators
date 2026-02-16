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
import { getTranslations } from "next-intl/server";

import { SpaceService } from "@/services/space-service";
import { auth } from "@/lib/auth";

export default async function ApiKeysPage() {
    const t = await getTranslations('admin.api_keys');
    const session = await auth();
    const tenantId = session?.user?.tenantId || '';
    const userId = session?.user?.id || '';

    const [keys, spaces] = await Promise.all([
        getApiKeys(),
        SpaceService.getAccessibleSpaces(tenantId, userId)
    ]);

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={<CreateApiKeyModal spaces={spaces as any[]} />}
            />

            <div className="grid gap-6">
                <ContentCard title={t('active_keys')} icon={<Key size={20} />}>
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                        <ApiKeyList keys={keys as any[]} />
                    </Suspense>
                </ContentCard>

                <ApiDocsSnippet />
            </div>
        </PageContainer>
    );
}
