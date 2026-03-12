import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { ProfileClient } from './ProfileClient';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

/**
 * 👤 User Profile Page (Server Component)
 * Phase 412: Zero-Waterfall fetch.
 * Fixed: Explicit NextIntlClientProvider for context safety.
 */
export default async function ProfilePage() {
    const session = await requirePermission('user:profile', 'read');
    
    // 📡 Parallel fetch: User and i18n messages
    const [locale, messages, usersCollection] = await Promise.all([
        getLocale(),
        getMessages(),
        getTenantCollection('users', session as any)
    ]);

    const user = await usersCollection.findOne({ _id: (session as any).userId });

    // Map _id to id for consistency
    const initialUser = user ? { ...user, id: user._id.toString() } : null;

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ProfileClient initialUser={initialUser} />
        </NextIntlClientProvider>
    );
}
