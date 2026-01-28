"use client";

import { ShieldCheck, Lock } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

export function SecuritySection() {
    const secT = useTranslations('security');

    return (
        <section id="seguridad" className="py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-20 backdrop-blur-3xl shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 font-bold uppercase tracking-widest px-4 py-1.5 backdrop-blur-sm">
                                <Lock size={12} className="mr-2" />
                                Security First
                            </Badge>
                            <h2 className="text-4xl md:text-6xl font-black font-outfit text-white mb-8 leading-tight">
                                {secT('title')}
                            </h2>
                            <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                                {secT('subtitle')}
                            </p>

                            <div className="space-y-8">
                                <SecurityFeature
                                    title={secT('f1_title')}
                                    description={secT('f1_desc')}
                                />
                                <SecurityFeature
                                    title={secT('f2_title')}
                                    description={secT('f2_desc')}
                                />
                                <SecurityFeature
                                    title={secT('f3_title')}
                                    description={secT('f3_desc')}
                                />
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-950 p-4 shadow-2xl overflow-hidden hover:border-emerald-500/30 transition-colors duration-500">
                                <Image
                                    src="/security-dashboard.png"
                                    alt="Security Dashboard"
                                    width={600}
                                    height={400}
                                    className="rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 w-full h-auto object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 backdrop-blur-md">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Health Status</p>
                                            <p className="text-sm text-emerald-400 font-medium">All systems operational</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold backdrop-blur-md hidden sm:block">
                                        ENCRYPTION: AES-256
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SecurityFeature({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex gap-6 group">
            <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-400 transition-colors">{description}</p>
            </div>
        </div>
    );
}
