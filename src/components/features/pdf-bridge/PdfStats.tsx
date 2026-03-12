"use client";

import React from "react";
import { FeatureStatPremium } from "../FeatureStatPremium";

interface PdfStatsProps {
    t: any;
}

/**
 * PdfStats — ERA 14 Refactor
 * Grid of technical performance metrics for PDF Bridge.
 */
export function PdfStats({ t }: PdfStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
            <FeatureStatPremium
                value="99.8%"
                label="Precisión de OCR"
                description="Extracción impecable incluso en documentos con baja calidad de escaneo."
                variant="blue"
                delay={0.1}
            />
            <FeatureStatPremium
                value="< 2s"
                label="Tiempo de Ingesta"
                description="Procesamiento ultrarrápido por cada 100 páginas de contenido técnico."
                variant="teal"
                delay={0.2}
            />
            <FeatureStatPremium
                value="32+"
                label="Idiomas"
                description="Soporte nativo para especificaciones internacionales en múltiples lenguajes."
                variant="amber"
                delay={0.3}
            />
        </div>
    );
}
