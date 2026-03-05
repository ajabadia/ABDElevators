import { create } from 'zustand';

interface SidekickMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface SidekickState {
    isOpen: boolean;
    messages: SidekickMessage[];
    currentContext: string;
    contextMetadata: Record<string, any>;

    toggleSidekick: () => void;
    setOpen: (open: boolean) => void;
    addMessage: (message: Omit<SidekickMessage, 'id' | 'timestamp'>) => void;
    setContext: (context: string, metadata?: Record<string, any>) => void;
    clearMessages: () => void;
}

export const useSidekickStore = create<SidekickState>((set) => ({
    isOpen: false,
    messages: [
        {
            id: '1',
            role: 'assistant',
            content: "Hola, soy tu Co-Pilot de ABD. Estoy analizando esta página para ayudarte con cualquier duda técnica o de negocio.",
            timestamp: new Date()
        }
    ],
    currentContext: '',
    contextMetadata: {},

    toggleSidekick: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (open) => set({ isOpen: open }),
    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, { ...msg, id: Math.random().toString(36).substr(2, 9), timestamp: new Date() }]
    })),
    setContext: (context, metadata = {}) => set({ currentContext: context, contextMetadata: metadata }),
    clearMessages: () => set({ messages: [] })
}));
