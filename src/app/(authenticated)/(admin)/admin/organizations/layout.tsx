"use client";

import { ReactNode, useEffect, useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { type TenantConfig } from "@/lib/schemas";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * Organizations Cluster Layout
 * Centrally manages tenant configuration for all organization sub-pages.
 * Resolves the hanging spinner issue by ensuring config is fetched or error is handled.
 */
export default function OrganizationsLayout({ children }: { children: ReactNode }) {
    const t = useTranslations("common.notifications");
    const { config, setConfig, setIsLoading } = useTenantConfigStore();
    const [fetched, setFetched] = useState(false);

    const { isLoading } = useApiList<TenantConfig>({
        endpoint: '/api/admin/tenants',
        dataKey: 'tenants',
        autoFetch: !config && !fetched,
        onSuccess: (data) => {
            setFetched(true);
            if (data && data.length > 0) {
                setConfig(data[0]);
            } else {
                console.warn("[OrganizationsLayout] No tenants found for the current user.");
            }
        },
        onError: (err) => {
            setFetched(true);
            toast.error(t("error"), {
                description: typeof err === 'string' ? err : "Error loading organization settings"
            });
        }
    });

    useEffect(() => {
        setIsLoading(isLoading);
    }, [isLoading, setIsLoading]);

    return <>{children}</>;
}
