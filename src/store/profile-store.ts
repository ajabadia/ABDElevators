import { getErrorMessage } from '@/lib/errors-helpers';
import { create } from 'zustand';

interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    jobTitle?: string;
    role: string;
    photoUrl?: string;
    photoCloudinaryId?: string;
    createdAt: string;
    tenantId: string;
    mfaEnabled?: boolean;
    technicianPinHash?: string;
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
            if (!res.ok) throw new Error('Error loading profile');
            const data = await res.json();
            // Map _id to id for consistency
            if (data._id) data.id = data._id;
            set({ user: data, loading: false });
        } catch (error: unknown) {
            set({ error: getErrorMessage(error), loading: false });
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
