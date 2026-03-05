import { create } from 'zustand';

interface HealthData {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    ingestSuccessRate: number;
    avgRagLatency: number;
    securityAnomaliesCount: number;
    activeUsers24h: number;
    activeProcessingCount: number;
    activeJobs: Array<{ id: string; name: string; status: string; updatedAt: string }>;
    timestamp: string;
}

interface HealthState {
    health: HealthData | null;
    loading: boolean;
    error: string | null;
    lastFetched: number;
    fetchHealth: (force?: boolean) => Promise<void>;
}

/**
 * 💡 Centralized Health Store
 * ERA 10: Eliminates redundant fetches and 'failed to fetch' noise.
 */
export const useHealthStore = create<HealthState>((set, get) => ({
    health: null,
    loading: false,
    error: null,
    lastFetched: 0,
    fetchHealth: async (force = false) => {
        const { loading, lastFetched } = get();
        const now = Date.now();

        // Avoid redundant fetches (min 10s between fetches unless forced)
        if (loading || (!force && now - lastFetched < 10000)) return;

        set({ loading: true, error: null });

        try {
            const res = await fetch('/api/admin/tenant-health');
            if (res.ok) {
                const data = await res.json();
                set({
                    health: data.health,
                    loading: false,
                    lastFetched: now,
                    error: null
                });
            } else {
                const errText = await res.text();
                set({ error: `Server error: ${res.status}`, loading: false });
            }
        } catch (err) {
            console.warn('Health fetch aborted or failed:', err);
            set({ error: 'Failed to fetch pulse', loading: false });
        }
    }
}));
