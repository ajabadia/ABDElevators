"use client";

import React from "react";

// Modular Components
import { PdfHero } from "./pdf-bridge/PdfHero";
import { PdfFeatures } from "./pdf-bridge/PdfFeatures";
import { PdfIngestionProcess } from "./pdf-bridge/PdfIngestionProcess";
import { PdfStats } from "./pdf-bridge/PdfStats";
import { PdfCTA } from "./pdf-bridge/PdfCTA";

interface PdfBridgeClientProps {
    t: any;
}

/**
 * PdfBridgeClient — ERA 14 Refactor
 * 
 * Marketing landing page for PDF Bridge.
 * Refactored into modular sections for better maintenance.
 */
export default function PdfBridgeClient({ t }: PdfBridgeClientProps) {
    return (
        <main className="flex-1">
            <section className="pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <PdfHero t={t} />
                    <PdfFeatures t={t} />
                    <PdfIngestionProcess t={t} />
                    <PdfStats t={t} />
                    <PdfCTA t={t} />
                </div>
            </section>
        </main>
    );
}
