import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { ProfileClient } from './ProfileClient';

/**
 * 👤 User Profile Page (Server Component)
 * Phase 412: Zero-Waterfall fetch.
 */
export default async function ProfilePage() {
    const session = await requirePermission('user:profile', 'read');

    // 📡 Server-side fetch for zero waterfall
    const usersCollection = await getTenantCollection('users', session as any);
    const user = await usersCollection.findOne({ _id: (session as any).userId });

    // Map _id to id for consistency
    const initialUser = user ? { ...user, id: user._id.toString() } : null;

    return <ProfileClient initialUser={initialUser} />;
}
