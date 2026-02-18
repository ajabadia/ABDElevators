"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Premium Loading Skeleton for Marketing Pages (Suite Era)
 * Mimics the PublicNavbar and general layout to avoid FOIT.
 */
export function MarketingLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            {/* Navbar Skeleton */}
            <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
                    <Skeleton className="w-24 h-6 bg-white/10" />
                </div>
                <div className="hidden md:flex gap-10">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="w-16 h-3 bg-white/10" />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                    <Skeleton className="w-20 h-9 rounded-md bg-white/10" />
                    <Skeleton className="w-28 h-9 rounded-md bg-teal-500/20" />
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 flex-1">
                <div className="container mx-auto max-w-5xl">
                    {/* Badge and Title Skeleton */}
                    <div className="space-y-4 mb-16">
                        <Skeleton className="w-24 h-5 rounded-full bg-white/5" />
                        <Skeleton className="w-2/3 h-12 bg-white/10" />
                        <Skeleton className="w-1/2 h-6 bg-white/5" />
                    </div>

                    {/* Content Block Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        <Skeleton className="h-64 rounded-[2.5rem] bg-white/[0.02] border border-white/10" />
                        <Skeleton className="h-64 rounded-[2.5rem] bg-white/[0.02] border border-white/10" />
                    </div>

                    <div className="space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-6">
                                <Skeleton className="w-16 h-16 rounded-2xl bg-white/[0.03] shrink-0" />
                                <div className="space-y-3 flex-1 pt-2">
                                    <Skeleton className="w-48 h-8 bg-white/10" />
                                    <Skeleton className="w-full h-20 bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer Skeleton */}
            <footer className="py-20 border-t border-white/5 bg-slate-950">
                <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
                            <Skeleton className="w-24 h-6 bg-white/10" />
                        </div>
                        <Skeleton className="w-full h-12 bg-white/5" />
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="w-20 h-4 bg-white/10" />
                            <div className="space-y-2">
                                <Skeleton className="w-24 h-3 bg-white/5" />
                                <Skeleton className="w-20 h-3 bg-white/5" />
                                <Skeleton className="w-28 h-3 bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    );
}
