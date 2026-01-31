import { getApiKeys } from "@/actions/api-keys";
import { ApiKeyList } from "@/components/admin/api-keys/ApiKeyList";
import { CreateApiKeyModal } from "@/components/admin/api-keys/CreateApiKeyModal";
import { ApiDocsSnippet } from "@/components/admin/api-keys/ApiDocsSnippet";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ApiKeysPage() {
    const keys = await getApiKeys();

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">API Access Management</h1>
                    <p className="text-slate-400">Manage API Keys for external integrations (ERP, CRM, IoT).</p>
                </div>
                <CreateApiKeyModal />
            </div>

            <div className="grid gap-8">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Active Keys
                    </h2>
                    <Suspense fallback={<Skeleton className="h-32 w-full bg-slate-800" />}>
                        <ApiKeyList keys={keys as any[]} />
                    </Suspense>
                </section>

                <ApiDocsSnippet />
            </div>
        </div>
    );
}
