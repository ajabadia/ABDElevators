import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { UserRole } from '@/types/roles';

const permissionCache = new Map<string, boolean>();

export function useGuardian() {
    const { data: session } = useSession();

    /**
     * Checks if the user is allowed to perform an action on a resource.
     * Note: For critical operations, ALWAYS verify server-side.
     */
    const can = useCallback(async (resource: string, action: string): Promise<boolean> => {
        if (!session?.user) return false;

        // Super Admin Bypass
        if (session.user.role === UserRole.SUPER_ADMIN) return true;

        const cacheKey = `${resource}:${action}`;
        if (permissionCache.has(cacheKey)) {
            return permissionCache.get(cacheKey)!;
        }

        try {
            const res = await fetch('/api/admin/permissions/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resource, action })
            });

            if (!res.ok) return false;
            const { allowed } = await res.json();

            permissionCache.set(cacheKey, allowed);
            return allowed;
        } catch (error) {
            console.error('[Guardian] Evaluation failed', error);
            return false;
        }
    }, [session]);

    /**
     * Performs a bulk permission check. Useful for filtering lists or navigation.
     */
    const canBulk = useCallback(async (checks: { resource: string, action: string }[]): Promise<Record<string, boolean>> => {
        if (!session?.user) return {};

        // Super Admin Bypass
        if (session.user.role === UserRole.SUPER_ADMIN) {
            return checks.reduce((acc, c) => ({ ...acc, [`${c.resource}:${c.action}`]: true }), {});
        }

        const results: Record<string, boolean> = {};
        const pendingChecks: { resource: string, action: string }[] = [];

        checks.forEach(c => {
            const key = `${c.resource}:${c.action}`;
            if (permissionCache.has(key)) {
                results[key] = permissionCache.get(key)!;
            } else {
                pendingChecks.push(c);
            }
        });

        if (pendingChecks.length === 0) return results;

        try {
            const res = await fetch('/api/admin/permissions/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingChecks)
            });

            if (!res.ok) return results;
            const { results: apiResults } = await res.json();

            apiResults.forEach((r: any) => {
                const key = `${r.resource}:${r.action}`;
                permissionCache.set(key, r.allowed);
                results[key] = r.allowed;
            });

            return results;
        } catch (error) {
            console.error('[Guardian] Bulk evaluation failed', error);
            return results;
        }
    }, [session]);

    return { can, canBulk, isLoading: !session };
}
