"use client";

import { Cpu, Database, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { SectionHeading } from "./SectionHeading";

export function FeatureGrid() {
    const featT = useTranslations('features');

    return (
        <section id="tecnologia" className="py-32 bg-slate-950 relative">
            <div className="container mx-auto px-6">
                <SectionHeading
                    title={featT('title')}
                    subtitle={featT('subtitle')}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Cpu className="text-teal-400" size={32} />}
                        title={featT('f1_title')}
                        description={featT('f1_desc')}
                        link="/features/dual-engine"
                    />
                    <FeatureCard
                        icon={<Database className="text-blue-400" size={32} />}
                        title={featT('f2_title')}
                        description={featT('f2_desc')}
                        link="/features/vector-search"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="text-emerald-400" size={32} />}
                        title={featT('f3_title')}
                        description={featT('f3_desc')}
                        link="/features/audit-trail"
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link?: string }) {
    return (
        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-2 duration-300">
            <div className="mb-6 p-4 rounded-2xl bg-slate-900 w-fit group-hover:scale-110 transition-transform duration-500 shadow-xl border border-white/5">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-outfit">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            {link ? (
                <Link href={link}>
                    <div className="mt-8 flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
                        Saber más <ChevronRight size={14} />
                    </div>
                </Link>
            ) : (
                <div className="mt-8 flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                    Próximamente <ChevronRight size={14} />
                </div>
            )}
        </div>
    );
}
