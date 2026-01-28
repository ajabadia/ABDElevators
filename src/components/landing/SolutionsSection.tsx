"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { SectionHeading } from "./SectionHeading";

export function SolutionsSection() {
    const solT = useTranslations('solutions');

    return (
        <section id="soluciones" className="py-32 bg-slate-900/30">
            <div className="container mx-auto px-6">
                <SectionHeading
                    title={solT('title')}
                    subtitle={solT('subtitle')}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <SolutionCard
                        title={solT('s1_title')}
                        description={solT('s1_desc')}
                        image="/solutions-industrial.png"
                    />
                    <SolutionCard
                        title={solT('s2_title')}
                        description={solT('s2_desc')}
                        image="/solutions-legal.png"
                    />
                    <SolutionCard
                        title={solT('s3_title')}
                        description={solT('s3_desc')}
                        image="/solutions-it.png"
                    />
                </div>
            </div>
        </section>
    );
}

function SolutionCard({ title, description, image }: { title: string; description: string; image: string }) {
    return (
        <div className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900/50 hover:border-teal-500/30 transition-all duration-500">
            <div className="aspect-[16/10] overflow-hidden relative">
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
            </div>
            <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-3 font-outfit">{title}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{description}</p>
                <Button variant="ghost" className="p-0 h-auto text-teal-400 hover:text-white hover:bg-transparent font-bold flex items-center gap-2 group/btn">
                    Explorar Solución <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}
