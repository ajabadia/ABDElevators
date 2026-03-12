import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { ValidationClient } from './ValidationClient';
import { ObjectId } from 'mongodb';

/**
 * 🏛️ Order Validation Page (Server Component)
 * Phase 412: Zero-Waterfall implementation.
 * Eliminates useEffect on first load and validates permissions server-side.
 */
export default async function ValidateOrderPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;

    // 🔐 Server-side security check
    const session = await requirePermission('technical:validation', 'read');

    // 📡 Server-side fetch (Pre-fetching order data)
    const entitiesCollection = await getTenantCollection('entities', session as any);
    const order = await entitiesCollection.findOne({
        _id: new ObjectId(id),
        tenantId: session.user.tenantId,
        type: 'ORDER' // Ensure it's an order
    });

    // Hydrate client with pre-fetched data
    return <ValidationClient id={id} initialOrder={JSON.parse(JSON.stringify(order))} />;
}
