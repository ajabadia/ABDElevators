"use client";

import { ApiKeyList } from "@/components/admin/api-keys/ApiKeyList";
import { CreateApiKeyModal } from "@/components/admin/api-keys/CreateApiKeyModal";
import { ApiDocsSnippet } from "@/components/admin/api-keys/ApiDocsSnippet";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { ContentCard } from "@/components/ui/content-card";
import { Key } from "lucide-react";
import { useTranslations } from "next-intl";

interface ApiKeyListItem {
    _id: string;
    tenantId: string;
    name: string;
    keyPrefix: string;
    permissions: string[];
    isActive: boolean;
    expiresAt?: Date;
    lastUsedAt?: Date;
    createdAt: Date;
}

interface SpaceListItem {
    _id: string;
    tenantId: string;
    name: string;
    slug: string;
    type: string;
}

interface ApiKeysClientProps {
    initialKeys: ApiKeyListItem[];
    initialSpaces: SpaceListItem[];
}

/**
 * 🔑 API Keys Management - Client View
 */
export default function ApiKeysClient({ initialKeys, initialSpaces }: ApiKeysClientProps) {
    const t = useTranslations('admin.api_keys');

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            backHref="/settings"
            actions={<CreateApiKeyModal spaces={initialSpaces} />}
        >

            <div className="grid gap-6">
                <ContentCard title={t('active_keys')} icon={<Key size={20} />}>
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                        <ApiKeyList keys={initialKeys} />
                    </Suspense>
                </ContentCard>

                <ApiDocsSnippet />
            </div>
        </FeatureShell>
    );
}
