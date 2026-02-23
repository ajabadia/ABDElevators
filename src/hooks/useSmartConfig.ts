"use client";

import { useState, useEffect } from "react";
import { DEFAULT_MODEL } from "@/lib/constants/ai-models";

/**
 * Interface representing the smart configuration for document analysis.
 */
export interface SmartConfig {
    /** Chunking level: 'bajo' (Simple), 'medio' (Semantic), 'alto' (LLM) */
    chunkingLevel: "bajo" | "medio" | "alto";
    /** LLM model to use for analysis */
    model: string;
    /** Temperature for the LLM (0.0 to 1.0) */
    temperature: number;
    /** Whether to mask Personally Identifiable Information */
    maskPii: boolean;
    /** Version string for tracking */
    version: string;
}

/**
 * useSmartConfig Hook
 * Automatically configures analysis parameters based on file type and name.
 * 
 * Logic:
 * - Default: Simple chunking, default flash model.
 * - Large PDFs (>2MB): Semantic chunking ('medio').
 * - Legal/Tech keywords: LLM chunking ('alto') and Pro model.
 * 
 * @param file The file being prepared for analysis
 * @returns An object containing the derived smart configuration
 */
export function useSmartConfig(file: File | null): SmartConfig {
    const [config, setConfig] = useState<SmartConfig>({
        chunkingLevel: "bajo",
        model: DEFAULT_MODEL,
        temperature: 0.1,
        maskPii: false,
        version: "1.0",
    });

    useEffect(() => {
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isPdf = file.type === "application/pdf";
        const isLarge = file.size > 2 * 1024 * 1024; // 2MB threshold

        let derivedLevel: "bajo" | "medio" | "alto" = "bajo";
        let derivedModel: string = DEFAULT_MODEL;
        let derivedTemp = 0.1;

        if (isPdf) {
            // PDFs are better suited for semantic chunking if they are large
            derivedLevel = isLarge ? "medio" : "bajo";

            // Keywords that suggest high-precision requirements
            const highPrecisionKeywords = [
                "contrato", "legal", "especificacion", "normativa",
                "technical", "audit", "compliance", "anexo"
            ];

            const isHighPrecision = highPrecisionKeywords.some(keyword => fileName.includes(keyword));

            if (isHighPrecision) {
                derivedLevel = "alto"; // Use LLM Chunking
                derivedModel = "gemini-2.5-pro"; // Use Pro for complex docs
                derivedTemp = 0.0; // Zero temperature for deterministic extraction
            }
        }

        setConfig({
            chunkingLevel: derivedLevel,
            model: derivedModel,
            temperature: derivedTemp,
            maskPii: false,
            version: "1.0",
        });
    }, [file]);

    return config;
}
