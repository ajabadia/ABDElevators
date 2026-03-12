import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { GroupHierarchyClient } from './GroupHierarchyClient';

/**
 * 🏛️ Permission Group Hierarchy Page (Server Component)
 * Phase 412: Zero-Waterfall fetch.
 */
export default async function GroupHierarchyPage() {
    const session = await requirePermission('admin:permissions:groups', 'read');

    // 📡 Server-side fetch for zero waterfall
    const rolesCollection = await getTenantCollection('roles', session as any);
    const roles = await rolesCollection.find({});

    return <GroupHierarchyClient initialRoles={roles as any} />;
}
