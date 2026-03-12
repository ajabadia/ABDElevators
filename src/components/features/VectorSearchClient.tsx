"use client";

import React from "react";

// Modular Components
import { VectorHero } from "./vector-search/VectorHero";
import { VectorComparison } from "./vector-search/VectorComparison";
import { VectorArchitecture } from "./vector-search/VectorArchitecture";
import { VectorStats } from "./vector-search/VectorStats";
import { VectorCTA } from "./vector-search/VectorCTA";

interface VectorSearchClientProps {
    t: any; // Translates
}

/**
 * VectorSearchClient — ERA 14 Refactor
 * 
 * Marketing landing page for Vector Search.
 * Refactored into modular sections for better maintenance.
 */
export default function VectorSearchClient({ t }: VectorSearchClientProps) {
    return (
        <main className="flex-1">
            <section className="pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <VectorHero t={t} />
                    <VectorComparison t={t} />
                    <VectorArchitecture t={t} />
                    <VectorStats t={t} />
                    <VectorCTA t={t} />
                </div>
            </section>
        </main>
    );
}
