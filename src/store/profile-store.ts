import { create } from 'zustand';

interface UserProfile {
    id: string;
    nombre?: string;
    apellidos?: string;
    email: string;
    puesto?: string;
    rol: string;
    foto_url?: string;
    foto_cloudinary_id?: string;
    createdAt: string;
    tenantId: string;
    mfaEnabled?: boolean;
    notificationPreferences?: Array<{ type: string, email: boolean, inApp: boolean }>;
}

interface ProfileState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
    setUser: (user: UserProfile | null) => void;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    user: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),

    fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/auth/profile');
            if (!res.ok) throw new Error('Error al cargar perfil');
            const data = await res.json();
            // Map _id to id for consistency
            if (data._id) data.id = data._id;
            set({ user: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateProfile: async (data) => {
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...data } });
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }
}));
