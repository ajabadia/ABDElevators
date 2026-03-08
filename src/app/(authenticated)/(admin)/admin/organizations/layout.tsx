"use client";

import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { useApiList } from "@/hooks/useApiList";
import { useTenantConfigStore } from "@/store/tenant-config-store";
import { type TenantConfig } from "@/lib/schemas";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * Organizations Cluster Layout
 * Centrally manages tenant configuration for all organization sub-pages.
 * Resolves the hanging spinner issue by ensuring config is fetched or error is handled.
 * Pattern: Zero-Leak (isMounted guard).
 */
export default function OrganizationsLayout({ children }: { children: ReactNode }) {
    const t = useTranslations("common.notifications");
    const { config, hydrate, setError, isFetched, error } = useTenantConfigStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Memoized callbacks to avoid infinite re-renders in useApiList hooks
    const handleSuccess = useCallback((data: TenantConfig[]) => {
        if (!isMounted.current) return;
        if (data && data.length > 0) {
            hydrate(data[0]);
        } else {
            console.warn("[OrganizationsLayout] No tenants found.");
            setError("No organizations found for this account.");
        }
    }, [hydrate, setError]);

    const handleError = useCallback((err: string | Error) => {
        if (!isMounted.current) return;
        const message = typeof err === 'string' ? err : "Error loading organization settings";
        setError(message);
        toast.error(t("error"), { description: message });
    }, [t, setError]);

    const { isLoading } = useApiList<TenantConfig>({
        endpoint: '/api/admin/tenants',
        dataKey: 'tenants',
        autoFetch: !config && !isFetched,
        onSuccess: handleSuccess,
        onError: handleError
    });

    // Unified condition: Show spinner only if we haven't tried to fetch yet
    const showSpinner = !isFetched && isLoading;

    return (
        <>
            {showSpinner ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                children
            )}
        </>
    );
}
