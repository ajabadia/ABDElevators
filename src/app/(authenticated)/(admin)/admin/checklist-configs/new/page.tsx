"use client";

import React from 'react';
import { ConfiguratorFull } from '@/verticals/elevators/components/configurator/ConfiguratorFull';

/**
 * Entry point for creating a new checklist configuration.
 * Uses the dynamic configurator in "new" mode.
 */
export default function NewChecklistConfigPage() {
    return <ConfiguratorFull isNew={true} />;
}
