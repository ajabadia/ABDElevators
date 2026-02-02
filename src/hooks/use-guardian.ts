import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export function useGuardian() {
    const { data: session } = useSession();

    /**
     * Checks if the user is allowed to perform an action on a resource.
     * Note: For critical operations, ALWAYS verify server-side.
     */
    const can = useCallback(async (resource: string, action: string): Promise<boolean> => {
        if (!session?.user) return false;

        // Super Admin Bypass
        if (session.user.role === 'SUPER_ADMIN') return true;

        try {
            // We call a lightweight API to evaluate the ABAC policy server-side
            // because client-side we don't have all policies or context (like server-time)
            const res = await fetch('/api/admin/permissions/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resource, action })
            });

            if (!res.ok) return false;
            const { allowed } = await res.json();
            return allowed;
        } catch (error) {
            console.error('[Guardian] Evaluation failed', error);
            return false;
        }
    }, [session]);

    return { can, isLoading: !session };
}
