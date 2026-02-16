"use client";

import React, { useEffect, useState } from 'react';
import { useGuardian } from '@/hooks/use-guardian';

interface GuardianGuardProps {
    resource: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Selective rendering based on Guardian V2 permissions.
 * Wraps elements that should only be visible to permitted users.
 */
export function GuardianGuard({
    resource,
    action,
    children,
    fallback = null
}: GuardianGuardProps) {
    const { can } = useGuardian();
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        can(resource, action).then((allowed) => {
            if (isMounted) setIsAllowed(allowed);
        });
        return () => { isMounted = false; };
    }, [resource, action, can]);

    if (isAllowed === null) return null; // Or a small skeleton
    if (isAllowed) return <>{children}</>;
    return <>{fallback}</>;
}
