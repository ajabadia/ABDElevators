'use client';

import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export interface NotificationOptions {
    persist?: boolean;
    level?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    type?: 'SYSTEM' | 'ANALYSIS_COMPLETE' | 'RISK_ALERT' | 'BILLING_EVENT' | 'SECURITY_ALERT';
    metadata?: Record<string, unknown>;
    link?: string;
}

/**
 * Unified Hook for Notifications.
 * Bridges immediate UI feedback (Sonner) with optional server-side persistence.
 */
export function useNotification() {
    const { data: session } = useSession();

    const notify = useCallback(async (title: string, message: string, options: NotificationOptions = {}) => {
        const {
            persist = false,
            level = 'INFO',
            type = 'SYSTEM',
            metadata,
            link
        } = options;

        // 1. Immediate UI Feedback (Toast)
        const toastFn = level === 'SUCCESS' ? toast.success :
            level === 'ERROR' ? toast.error :
                level === 'WARNING' ? toast.warning : toast.info;

        toastFn(title, { description: message });

        // 2. Persistent Notification (Server-side)
        if (persist && session?.user?.tenantId) {
            try {
                await fetch('/api/core/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        message,
                        level,
                        type,
                        metadata,
                        link,
                        tenantId: session.user.tenantId,
                        userId: session.user.id
                    })
                });
            } catch (error) {
                console.error('[useNotification] Failed to persist:', error);
            }
        }
    }, [session]);

    return { notify };
}
