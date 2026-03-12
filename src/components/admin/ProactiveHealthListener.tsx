"use client";

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, Zap } from 'lucide-react';

/**
 * 🛰️ ProactiveHealthListener
 * Polling component that monitors the proactive health API 
 * and notifies the administrator of anomalies.
 */
export function ProactiveHealthListener() {
    const lastAlertCountRef = useRef(0);

    const checkHealth = async () => {
        try {
            const res = await fetch('/api/admin/proactive-health');
            const data = await res.json();

            if (data.success && data.alerts && data.alerts.length > 0) {
                // To avoid spamming, we only notify if count changes or use IDs (simplified for now)
                if (data.alerts.length !== lastAlertCountRef.current) {
                    data.alerts.forEach((alert: any) => {
                        const isCritical = alert.severity === 'CRITICAL';
                        
                        toast(alert.message, {
                            description: isCritical ? "Action required immediately." : "System performance is degrading.",
                            icon: alert.type === 'SECURITY' ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : <Zap className="h-4 w-4 text-amber-500" />,
                            duration: isCritical ? 10000 : 5000,
                            position: 'top-right',
                            className: isCritical ? 'border-l-4 border-rose-500' : 'border-l-4 border-amber-500',
                        });
                    });
                    lastAlertCountRef.current = data.alerts.length;
                }
            } else {
                lastAlertCountRef.current = 0;
            }
        } catch (error) {
            console.error('🛰️ Health Listener Error:', error);
        }
    };

    useEffect(() => {
        // Initial check
        checkHealth();
        
        // Poll every 30 seconds for proactive detection
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    return null; // Side-effect only component
}
