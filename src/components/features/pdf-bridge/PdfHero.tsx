"use client";

import React from "react";
import { FileSearch } from "lucide-react";
import { FeatureHeroPremium } from "../FeatureHeroPremium";
import { motion } from "framer-motion";
import Image from "next/image";

interface PdfHeroProps {
    t: any;
}

/**
 * PdfHero — ERA 14 Refactor
 * Hero section for PDF Bridge showcasing extraction visualization.
 */
export function PdfHero({ t }: PdfHeroProps) {
    return (
        <>
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<FileSearch size={32} />}
                gradient="from-blue-600/20"
            />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative rounded-[3rem] overflow-hidden border border-white/10 mb-32 shadow-2xl group ring-1 ring-white/5"
            >
                <Image
                    src="/feature-pdf-bridge.png"
                    alt="PDF Bridge Extraction Visualization"
                    width={1400}
                    height={800}
                    className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </motion.div>
        </>
    );
}
