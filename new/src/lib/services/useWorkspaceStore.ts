
import { create } from 'zustand';
import { FederatedPattern } from '../schemas';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface WorkspaceState {
    // Data
    currentReportId: string | null;
    activeDocumentTitle: string | null;
    chatHistory: ChatMessage[];
    federatedInsights: FederatedPattern[];

    // UI State
    isLoading: boolean;
    isSidebarOpen: boolean;
    error: string | null;

    // Actions
    setCurrentReport: (id: string, title?: string) => void;
    addChatMessage: (msg: ChatMessage) => void;
    clearChat: () => void;
    setFederatedInsights: (insights: FederatedPattern[]) => void;
    setLoading: (loading: boolean) => void;
    toggleSidebar: () => void;
    setError: (msg: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    currentReportId: null,
    activeDocumentTitle: null,
    chatHistory: [],
    federatedInsights: [],
    isLoading: false,
    isSidebarOpen: true,
    error: null,

    setCurrentReport: (id, title) => set({
        currentReportId: id,
        activeDocumentTitle: title || null,
        // When changing report, we might want to keep history or clear it? 
        // Usually clear it for a fresh context.
        chatHistory: [],
        federatedInsights: [],
        error: null
    }),

    addChatMessage: (msg) => set((state) => ({
        chatHistory: [...state.chatHistory, msg]
    })),

    clearChat: () => set({ chatHistory: [] }),

    setFederatedInsights: (insights) => set({ federatedInsights: insights }),

    setLoading: (loading) => set({ isLoading: loading }),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setError: (msg) => set({ error: msg }),
}));
