import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OfflineTask {
    id: string;
    type: string;
    data: any;
    timestamp: number;
}

interface OfflineState {
    queue: OfflineTask[];
    addToQueue: (type: string, data: any) => void;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;
}

/**
 * 📱 FASE 503: Offline Store para técnicos.
 * Usamos localStorage explícitamente para persistencia persistente en PWA.
 */
export const useOfflineStore = create<OfflineState>()(
    persist(
        (set) => ({
            queue: [],
            addToQueue: (type, data) => set((state) => ({ 
                queue: [...state.queue, { id: crypto.randomUUID(), type, data, timestamp: Date.now() }] 
            })),
            removeFromQueue: (id) => set((state) => ({ 
                queue: state.queue.filter(t => t.id !== id) 
            })),
            clearQueue: () => set({ queue: [] }),
        }),
        {
            name: 'abd-offline-queue',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
