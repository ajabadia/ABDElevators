"use client";

import React from "react";

// Modular Components
import { FederatedHero } from "./federated/FederatedHero";
import { FederatedValues } from "./federated/FederatedValues";
import { FederatedArchitecture } from "./federated/FederatedArchitecture";
import { FederatedShowcase } from "./federated/FederatedShowcase";
import { FederatedCTA } from "./federated/FederatedCTA";

interface FederatedClientProps {
    t: any;
}

/**
 * FederatedClient — ERA 14 Refactor
 * 
 * Marketing landing page for Federated Intelligence.
 * Refactored into modular sections for better maintenance.
 */
export default function FederatedClient({ t }: FederatedClientProps) {
    return (
        <main className="flex-1">
            <section className="pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <FederatedHero t={t} />
                    <FederatedValues t={t} />
                    <FederatedArchitecture t={t} />
                    <FederatedShowcase t={t} />
                    <FederatedCTA t={t} />
                </div>
            </section>
        </main>
    );
}
