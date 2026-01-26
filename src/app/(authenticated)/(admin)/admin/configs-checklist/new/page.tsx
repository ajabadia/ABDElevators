"use client";

import React from 'react';
import { ConfiguratorFull } from '@/components/admin/configurator/ConfiguratorFull';

/**
 * Entry point for creating a new checklist configuration.
 * Uses the dynamic configurator in "new" mode.
 */
export default function NewChecklistConfigPage() {
    return <ConfiguratorFull isNew={true} />;
}
